import { IExportObject } from "./IExportObject";

const ExportMeta = Symbol("ExportMeta");
const Dependencies: { [name: string]: any } = {};

export enum ExportType
{
    // Everything (e.g. for networking)
    All = 0,

    // More restircted (e.g. for a board editor)
    User = 1
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
     * Create an instance of a class by property (using the dependencies classes).
     * @param className 
     */
    public static FromName<T extends Exportable>(name: string, ...args: any[]): T
    {
        const classObj = Dependencies[name] || null;

        return classObj && new classObj(...args);
    }

    /**
     * Export all (registered) properties of THIS class - but not itself.
     * @param access
     */
    public Export(access: number = 0): IExportObject[]
    {
        const result: IExportObject[] = [];

        for (let desc of this[ExportMeta])
        {   
            if(desc.Access < access) 
            {
                continue;
            }

            const exported = Exportable.Export(this[desc.Name], desc.Name, access);

            if(exported)
            {
                result.push(exported);
            }
        }

        return result;
    }

    /**
     * Export a whole object - including itself.
     * @param object The object to export.
     * @param access
     * @param name Name to export with.
     */
    public static Export(object: any, name: string = null, access: number = 0): IExportObject
    {
        // Export each element of an array
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
     * Import all (registered) properties.
     * @param input 
     */
    public Import(input: IExportObject[]): void
    {
        for (let element of input)
        {
            const desc = this[ExportMeta].find(i => i.Name == element.Name);

            // Only allow importing registered props
            if(!desc)
            {
                continue;
            }

            const imported = Exportable.Import(element);

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
                this[element.Name] = imported;
            }
        }
    }

    /**
     * Create a whole object.
     * @param input 
     */
    public static Import(input: IExportObject): any
    {
        // Import array
        if(input.Class == "Array")
        {
            return input.Payload.map(e => Exportable.Import(e));
        }
        
        // Import native types
        if(["string", "number", "boolean"].includes(input.Class))
        {
            return input.Payload;
        }

        // Import Exportable types
        const instance = Exportable.FromName(input.Class, ...(input.Args || []));

        instance && instance.Import(input.Payload);

        return instance;
    }

    /**
     * Return the difference from source to target (properties of source).
     * @param source 
     * @param target 
     * @param depth Depth limit.
     */
    public static Diff(source: IExportObject, target: IExportObject, depth: number = 3): IExportObject
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
                return source.Payload != target.Payload 
                    ? source 
                    : null;
            default:
                const diff: IExportObject[] = source.Payload
                    .map(ae => target.Payload.find(be => 
                        Exportable.Diff(ae, be, depth - 1)))
                    .filter(ae => ae);

                return !diff.length ? null : {
                    Name: source.Name,
                    Class: source.Class,
                    Payload: diff
                };
        }
    }

    /**
     * Shallow merge two selected objects. Only the top layer 
     * gonna be merged - so this is not a deep merge.
     * @param target Other gonna be merged here!
     * @param other 
     */
    public static Merge(target: IExportObject, other: IExportObject): void
    {
        if(!target || !target.Payload || !target.Payload.length)
        {
            return;
        }

        const otherProps = this.Dict(other)
        
        target.Payload.forEach((prop, i) => 
        {
            if(otherProps.hasOwnProperty(prop.Name))
            {
                target.Payload[i] = otherProps[prop.Name];
            }
        });
    }

    /**
     * Shallow convert an IExportObject to dictionary.
     * Top class property gonna be lost!
     * @param obj 
     */
    public static Dict(obj: IExportObject): { [id: string]: IExportObject }
    {
        const props = {};

        obj && obj.Payload && obj.Payload.length && 
            obj.Payload.forEach(p => props[p.Name] = p);

        return props;
    }
}