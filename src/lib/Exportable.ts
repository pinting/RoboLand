import { Logger } from "./Util/Logger";
import { Tools } from "./Util/Tools";
import { Dump } from "./Dump";

const ExportMetaKey = Symbol("ExportMeta");
const Dependencies: { [name: string]: any } = {};

export enum ExportType
{
    /**
     * NETWORK only
     */
    Net = 0,

    /**
     * NETWORK and DISK
     */
    NetDisk = 1
}

export interface ExportProperty
{
    Access: number;
    Name: string;
    Callback?: (s: any, v: any) => void;
}

export interface ExportableArgs
{
    id?: string;
}

export abstract class Exportable
{
    @Exportable.Register(ExportType.Net)
    protected id: string = Tools.Unique();

    private [ExportMetaKey]: ExportProperty[];
    
    public Init(args: ExportableArgs = {})
    {
        this.InitPre(args);
        this.InitPost(args);
    }

    /**
     * For direct assignments. This will be called first!
     * @param args 
     */
    protected InitPre(args: ExportableArgs = {})
    {
        this.id = args.id === undefined ? this.id : args.id;
    }

    /**
     * For function setters.
     * @param args 
     */
    protected InitPost(args: ExportableArgs = {})
    {
        // Leave for child classes to implement
    }
    
    /**
     * Register a class with a name as a dependency.
     * @param classObj 
     * @param name
     */
    public static Dependency(classObj: any, name: string = null)
    {
        Dependencies[name || classObj.name] = classObj;
    }

    /**
     * Decorator to register a property as something to export.
     * @param access Set the access level.
     * @param cb Used to set the property insted of the default way.
     */
    public static Register(access: number = 0, cb: (s: any, v: any) => void = null) 
    {
        return (target: Exportable, name: string) =>
        {
            // We should not use hasOwnProperty
            // because only one ExportMeta should
            // exists on a prototype chain
            if(!target[ExportMetaKey])
            {
                target[ExportMetaKey] = [];
            }

            target[ExportMetaKey].push({
                Access: access,
                Name: name,
                Callback: cb
            });
        }
    }
    
    /**
     * Create an instance of a class by name (using the dependencies list).
     * @param className 
     */
    public static FromName<T extends Exportable>(name: string, ...args: any[]): T
    {
        if(!Dependencies.hasOwnProperty(name))
        {
            Logger.Warn("Class of dump is missing from dependencies", name);

            return null;
        }

        const classObj = Dependencies[name];

        return classObj && new classObj(...args);
    }

    public Clone(): Exportable
    {
        return Exportable.Import(Exportable.Export(this));
    }

    /**
     * Self export to Dump.
     * @param access
     */
    public Export(access: number = 0): Dump[]
    {
        const result: Dump[] = [];

        for (let desc of this[ExportMetaKey])
        {   
            if(desc.Access < access) 
            {
                continue;
            }

            const dump = Exportable.Export(this[desc.Name], desc.Name, access);

            if(dump)
            {
                result.push(dump);
            }
        }

        return result;
    }

    /**
     * Export an object to Dump (standalone).
     * @param object
     * @param access
     * @param name Name to export with.
     */
    public static Export(object: any, name: string = null, access: number = 0): Dump
    {
        // Export each unit of an array
        if(object instanceof Array)
        {
            const dump = {
                Name: name,
                Class: object.constructor.name,
                Payload: object.map((e, i) => Exportable.Export(e, i.toString(), access))
            };

            Logger.Debug("Exported array", object, dump);

            return dump;
        }

        // Export exportable
        if(object instanceof Exportable)
        {
            const dump = {
                Name: name,
                Class: object.constructor.name,
                Payload: object.Export(access)
            };

            Logger.Debug("Exported object", object, dump);

            return dump;
        }

        // Export native types (string, number or boolean)
        if(["string", "number", "boolean"].includes(typeof object))
        {
            let payload = object;

            if(typeof object === "number")
            {
                payload = object.toString();
            }

            const dump = {
                Name: name,
                Class: typeof object,
                Payload: payload
            };

            Logger.Debug("Exported native type", object, dump);

            return dump;
        }

        return null;
    }

    /**
     * Self import an Dump.
     * @param dumps 
     */
    public Import(dumps: Dump[]): void
    {
        Logger.Debug(this, "Importing properties", dumps);

        this.InitPre();

        for (let dump of dumps)
        {
            const desc = this[ExportMetaKey].find(i => i.Name == dump.Name);

            // Only allow importing registered props
            if(!desc)
            {
                Logger.Warn(this, "Unregistered property (or no name) in Dump", dump.Name);
                continue;
            }

            const imported = Exportable.Import(dump);

            // If undefined skip importing it
            if(imported === undefined)
            {
                Logger.Warn(this, "Skipping import on undefined", dump);
                continue;
            }

            // Use the setter if defined or use the built in one
            if(desc.Callback)
            {
                desc.Callback(this, imported);
            }
            else
            {
                this[dump.Name] = imported;
            }
        }

        this.InitPost();
    }

    /**
     * Import an Dump (standalone).
     * @param dump 
     */
    public static Import(dump: Dump): any
    {
        // Import array
        if(dump.Class == "Array")
        {
            const result = dump.Payload.map(e => Exportable.Import(e));

            Logger.Debug("Array imported", dump, result);

            return result;
        }
        
        // Import native types
        if(["string", "number", "boolean"].includes(dump.Class))
        {
            let result = dump.Payload;

            if(dump.Class === "number")
            {
                result = parseFloat(dump.Payload);
            }

            Logger.Debug("Native type imported", dump, result);

            return result;
        }

        // Import Exportable types
        const result = Exportable.FromName(dump.Class, ...(dump.Args || []));

        result && result.Import(dump.Payload);

        Logger.Debug("Object imported", dump, result);

        return result;
    }
}