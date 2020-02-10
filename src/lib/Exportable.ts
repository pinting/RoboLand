import { IDump } from "./IDump";
import { Logger } from "./Util/Logger";
import { Tools } from "./Util/Tools";
import { Http } from "./Util/Http";
import { ResourceManager } from "./Util/ResourceManager";

const ExportMeta = Symbol("ExportMeta");
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
     * These properties will not be moved to the base.
     * By doing this, we can use the same base for multiply objects.
     */
    public static SaveFileExtract = ["position", "scale", "rotation"];

    /**
     * Under this length limit, the exported JSON will not be splitted
     * into multiply files.
     */
    public static SaveSplitLimit = Infinity;

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
            let payload = object;

            if(typeof object === "number")
            {
                payload = object.toString();
            }

            return {
                Name: name,
                Class: typeof object,
                Payload: payload
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
            if(dump.Class === "number")
            {
                return parseFloat(dump.Payload);
            }

            return dump.Payload;
        }

        // Import Exportable types
        const instance = Exportable.FromName(dump.Class, ...(dump.Args || []));

        instance && instance.Import(dump.Payload);

        return instance;
    }
    
    /**
     * Save dump as a resource.
     * @param json JSON of the dump 
     * @param dump Dump object of the dump 
     */
    private static async SaveDump(dump: IDump, overwrite: boolean): Promise<string>
    {
        const json = JSON.stringify(dump, null, 4);
        const buffer = Tools.StringToBuffer(json);
        const hash = await Tools.Sha256(buffer);
        const existing = ResourceManager.ByHash(hash);

        if(existing)
        {
            return existing.Uri;
        }

        let name = `${dump.Name ? `${dump.Name.toString().toLowerCase()}-` : ""}${dump.Class.toLowerCase()}`;

        if(overwrite)
        {
            await ResourceManager.RawAdd(name, buffer);
        }
        else
        {
            name = await ResourceManager.Add(name, buffer);
        }

        return name;
    }

    /**
     * Save an exportable as small resources.
     * @param dump 
     * @param overwrite
     */
    public static async Save(dump: IDump, overwrite: boolean = false): Promise<void>
    {
        const extract = (dump: IDump) =>
        {
            const toRemove = [];

            for(let index in dump.Payload as IDump[])
            {
                const e = dump.Payload[index];

                if(Exportable.SaveFileExtract.includes(e.Name))
                {
                    toRemove.unshift([e, index]);
                }
            }
            
            toRemove.forEach(e => (dump.Payload as IDump[]).splice(e[1], 1));

            return toRemove.map(e => e[0]);
        }

        const process = async (dump: IDump): Promise<IDump> =>
        {
            if(["string", "number", "boolean"].includes(dump.Class))
            {
                return dump;
            }

            if(!dump.Payload || !dump.Payload.length)
            {
                return dump;
            }
            
            let newPayload: IDump[] = [];

            for(let subDump of dump.Payload as IDump[])
            {
                newPayload.push(await process(subDump));
            }

            const newDump: IDump = { ...dump, Payload: newPayload };
            const extracted = extract(newDump);
            const json = JSON.stringify(newDump);

            if(!dump.Base && json.length < Exportable.SaveSplitLimit)
            {
                return newDump;
            }
            
            const fileName = await Exportable.SaveDump(newDump, overwrite);

            return {
                Name: dump.Name,
                Class: dump.Class,
                Payload: [
                    ...extracted
                ],
                Base: fileName
            };
        }

        await Exportable.SaveDump(await process(dump), overwrite);
    }

    /**
     * Resolve split up dump by putting together the pieces.
     * @param dump Dump to resolve.
     * @returns Resolved new dump.
     */
    public static Resolve(dump: IDump): IDump
    {
        if(!dump)
        {
            return;
        }

        let result = { ...dump };

        if(dump.Base)
        {
            const resource = ResourceManager.ByUri(dump.Base);

            if(resource)
            {
                const baseDump = JSON.parse(Tools.BufferToString(resource.Buffer)) as IDump;
                
                if(baseDump && baseDump.Class === dump.Class)
                {
                    result = {
                        ...result,
                        Payload: [
                            ...(baseDump.Payload && baseDump.Payload.length ? baseDump.Payload : []),
                            ...(dump.Payload && dump.Payload.length ? dump.Payload : []),
                        ]
                    };
                }
            }
        }

        if(["string", "number", "boolean"].includes(result.Class))
        {
            return result;
        }

        if(result.Payload && result.Payload.length)
        {
            for(let i in result.Payload)
            {
                result.Payload[i] = Exportable.Resolve(result.Payload[i]);
            }
        }

        return result;
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

    /**
     * Return true if only the 
     * @param diff
     */
    // TODO: Fix this
    public static IsMovementDiff(diff: IDump): boolean
    {
        const props = Exportable.ToDict(diff);

        // Delete ID if it exists, because we do not need it
        if(props.id)
        {
            delete props.id;
        }

        // No diff
        if(Object.keys(props).length == 0)
        {
            return true;
        }

        // Only position diff
        if(Object.keys(props).length === 1 &&
            props.hasOwnProperty("position"))
        {
            return true;
        }

        // Only angle diff
        if(Object.keys(props).length === 1 &&
            props.hasOwnProperty("rotation"))
        {
            return true;
        }

        // Only position and angle diff
        if(Object.keys(props).length === 2 &&
            props.hasOwnProperty("position") &&
            props.hasOwnProperty("rotation"))
        {
            return true;
        }

        return false;
    }
}