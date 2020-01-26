import { IDump } from "./IDump";
import { Logger } from "./Util/Logger";

const ExportMeta = Symbol("ExportMeta");
const Dependencies: { [name: string]: any } = {};

export enum ExportType
{
    // Everything (e.g. for networking)
    Hidden = 0,

    // More restircted (e.g. for a world editor)
    Visible = 1
}

export interface ExportDesc
{
    Access: number;
    Name: string;
    Callback?: (s: any, v: any) => void;
}

export abstract class Exportable
{
    private [ExportMeta]: ExportDesc[];

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
     * Decorator to register a name as exportable.
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
            if(!target[ExportMeta])
            {
                target[ExportMeta] = [];
            }

            target[ExportMeta].push({
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
            Logger.Warn(this, "Class of dump is missing from dependencies", name);

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
     * Self export to IDump.
     * @param access
     */
    public Export(access: number = 0): IDump[]
    {
        const result: IDump[] = [];

        for (let desc of this[ExportMeta])
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
     * Export an object to IDump (standalone).
     * @param object
     * @param access
     * @param name Name to export with.
     */
    public static Export(object: any, name: string = null, access: number = 0): IDump
    {
        // Export each unit of an array
        if(object instanceof Array)
        {
            return {
                Name: name,
                Class: object.constructor.name,
                Payload: object.map((e, i) => Exportable.Export(e, i.toString(), access))
            };
        }

        // Export exportable
        if(object instanceof Exportable)
        {
            return {
                Name: name,
                Class: object.constructor.name,
                Payload: object.Export(access)
            };
        }

        // Export native types (string, number or boolean)
        if(["string", "number", "boolean"].includes(typeof object))
        {
            return {
                Name: name,
                Class: typeof object,
                Payload: object
            };
        }

        return null;
    }

    /**
     * Self import an IDump.
     * @param dumps 
     */
    public Import(dumps: IDump[]): void
    {
        for (let dump of dumps)
        {
            const desc = this[ExportMeta].find(i => i.Name == dump.Name);

            // Only allow importing registered props
            if(!desc)
            {
                continue;
            }

            const imported = Exportable.Import(dump);

            // If undefined skip importing it
            if(imported === undefined)
            {
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
    }

    /**
     * Import an IDump (standalone).
     * @param dump 
     */
    public static Import(dump: IDump): any
    {
        // Import array
        if(dump.Class == "Array")
        {
            return dump.Payload.map(e => Exportable.Import(e));
        }
        
        // Import native types
        if(["string", "number", "boolean"].includes(dump.Class))
        {
            return dump.Payload;
        }

        // Import Exportable types
        const instance = Exportable.FromName(dump.Class, ...(dump.Args || []));

        instance && instance.Import(dump.Payload);

        return instance;
    }

    /**
     * Return the difference from source to target (properties of source).
     * @param source 
     * @param target 
     * @param depth Depth limit.
     */
    public static Diff(source: IDump, target: IDump, depth = 3): IDump
    {
        if(!depth || 
            !source || 
            !target || 
            !source.Class || 
            source.Class != target.Class || 
            source.Name != target.Name)
        {
            return null;
        }

        switch(source.Class)
        {
            case "number":
            case "string":
            case "boolean":
                return source.Payload != target.Payload ? source : null;
            default:
                const diff: IDump[] = source.Payload.filter((se: IDump) => 
                    target.Payload.find((te: IDump) => 
                        Exportable.Diff(se, te, depth - 1)));

                return diff.length == 0 ? null : {
                    Name: source.Name,
                    Class: source.Class,
                    Payload: diff
                };
        }
    }

    /**
     * Shallow merge two dumps. Only the top layer 
     * gonna be merged!
     * @param target Other gonna be merged here.
     * @param other 
     */
    public static Merge(target: IDump, other: IDump): void
    {
        if(!target || !target.Payload || !target.Payload.length)
        {
            return;
        }

        const otherProps = this.ToDict(other)
        
        target.Payload.forEach((prop: IDump, i: number) => 
        {
            if(otherProps.hasOwnProperty(prop.Name))
            {
                target.Payload[i] = otherProps[prop.Name];
            }
        });
    }

    /**
     * Shallow convert an IDump to dictionary.
     * Top class property gonna be lost!
     * @param obj 
     */
    public static ToDict(dump: IDump): { [id: string]: IDump }
    {
        const props = {};

        dump && dump.Payload && dump.Payload.length && 
            dump.Payload.forEach((dump: IDump) => props[dump.Name] = dump);

        return props;
    }
}