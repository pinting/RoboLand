import { Tools } from "./Util/Tools";
import { ResourceManager } from "./Util/ResourceManager";
import { Logger } from "./Util/Logger";

export class Dump
{
    Name: string | number;
    Class: string;
    Payload?: any;
    Base?: string;
    Args?: any[];

    /**
     * Save a Dump as a Resource.
     * @param dump 
     * @param overwrite
     */
    public static async Save(dump: Dump, overwrite: boolean = false): Promise<void>
    {
        const save = async (dump: Dump, overwrite: boolean) =>
        {
            const json = JSON.stringify(dump, null, 4);
            const buffer = Tools.UTF16ToANSI(json);
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


        const process = async (dump: Dump): Promise<Dump> =>
        {
            if(["string", "number", "boolean"].includes(dump.Class))
            {
                return dump;
            }

            if(!dump.Payload || !dump.Payload.length)
            {
                return dump;
            }
            
            let newPayload: Dump[] = [];

            for(let subDump of dump.Payload as Dump[])
            {
                newPayload.push(await process(subDump));
            }

            const newDump: Dump = { ...dump, Payload: newPayload };

            if(!dump.Base)
            {
                return newDump;
            }
            
            const fileName = await save(newDump, overwrite);

            return {
                Name: dump.Name,
                Class: dump.Class,
                Base: fileName,
                Payload: []
            };
        }

        await save(await process(dump), overwrite);
    }

    /**
     * Resolve split up dump by putting together the pieces.
     * @param dump Dump to resolve.
     * @returns Resolved new dump.
     */
    public static Resolve(dump: Dump): Dump
    {
        const resolveWithBase = (dump: Dump) =>
        {
            Logger.Info("Resolving resource", dump.Base);

            const resource = ResourceManager.ByUri(dump.Base);

            if(!resource)
            {
                Logger.Warn("Resource is not available", dump.Base);

                return dump;
            }

            const raw = Tools.ANSIToUTF16(resource.Buffer);
            let base: Dump;

            try
            {
                base = JSON.parse(raw) as Dump;
            }
            catch
            {
                Logger.Warn("Base cannot be parsed", dump.Base);

                return dump;
            }
            
            if(!base)
            {
                Logger.Warn("No dump was found in buffer", raw);

                return dump;
            }
            
            const basePayload: Dump[] = base.Payload && base.Payload.length ? base.Payload : [];
            const payload: Dump[] = dump.Payload && dump.Payload.length ? dump.Payload : [];
            const alreadyPresent = payload.map(d => d.Name);
            const newPayload = payload.concat(basePayload.filter(d => !alreadyPresent.includes(d.Name)));

            const next: Dump = {
                Name: dump.Name || base.Name,
                Class: dump.Class || base.Class,
                Base: base.Base || undefined,
                Payload: newPayload
            };

            return Dump.Resolve(next);
        }

        const resolveWithoutBase = (dump: Dump) =>
        {
            const result = { ...dump };

            if(["string", "number", "boolean"].includes(result.Class))
            {
                return result;
            }
    
            if(result.Payload && result.Payload.length)
            {
                for(let i in result.Payload)
                {
                    result.Payload[i] = Dump.Resolve(result.Payload[i]);
                }
            }

            return result;
        }

        if(!dump)
        {
            return;
        }

        if(dump.Base)
        {
            return resolveWithBase(dump);
        }
        else
        {
            return resolveWithoutBase(dump);
        }
    }
    

    /**
     * Return the difference from source to target (properties of source).
     * @param source 
     * @param target 
     * @param depth Depth limit.
     */
    public static Diff(source: Dump, target: Dump, depth = 3): Dump
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
                const diff: Dump[] = source.Payload.filter((se: Dump) => 
                    target.Payload.find((te: Dump) => 
                        Dump.Diff(se, te, depth - 1)));

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
    public static Merge(target: Dump, other: Dump): void
    {
        if(!target || !target.Payload || !target.Payload.length)
        {
            return;
        }

        const otherProps = this.ToDict(other)
        
        target.Payload.forEach((prop: Dump, i: number) => 
        {
            if(otherProps.hasOwnProperty(prop.Name))
            {
                target.Payload[i] = otherProps[prop.Name];
            }
        });
    }

    /**
     * Shallow convert an Dump to dictionary.
     * Top class property gonna be lost!
     * @param obj 
     */
    public static ToDict(dump: Dump): { [id: string]: Dump }
    {
        const props = {};

        dump && dump.Payload && dump.Payload.length && 
            dump.Payload.forEach((dump: Dump) => props[dump.Name] = dump);

        return props;
    }

    /**
     * Check if the dump only has the given list of properties.
     * @param dump
     * @param allowed List of property names that are allowed.
     */
    public static TestDump(dump: Dump, allowed: string[]): boolean
    {
        if(!dump || !dump.Payload || !dump.Payload.length)
        {
            return;
        }

        const payload = dump.Payload as Dump[];

        return !payload.find(dump => !allowed.includes(dump.Name.toString()));
    }
}