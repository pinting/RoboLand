import { IExportObject } from "./IExportObject";

export abstract class Exportable
{
    private static dependencies: { [name: string]: any } = {};

    /**
     * Register a class with a name.
     * @param name 
     * @param classObj 
     */
    public static Register(classObj: any, name: string = null)
    {
        Exportable.dependencies[name || classObj.name] = classObj;
    }
    
    /**
     * Create an instance of a class by name (using the dependencies classes).
     * @param className 
     */
    public static FromName<T extends Exportable>(name: string, ...args: any[]): T
    {
        const classObj = Exportable.dependencies[name] || null;

        return classObj && new classObj(...args);
    }

    /**
     * Export a property.
     * @param name
     */
    protected ExportProperty(name: string): IExportObject
    {
        return Exportable.Export(this[name], name);
    }

    /**
     * Export all properties.
     */
    public ExportAll(): IExportObject[]
    {
        const result: IExportObject[] = [];

        for (let property in this)
        {
            const exported = this.ExportProperty(property);

            if(exported)
            {
                result.push(exported);
            }
        }

        return result;
    }

    /**
     * Export a whole object - including itself.
     * @param object 
     * @param name 
     */
    public static Export(object: any, name: string = null): IExportObject
    {
        // Export each element of an array
        if(object instanceof Array)
        {
            return {
                Name: name,
                Class: object.constructor.name,
                Payload: object.map((e, i) => Exportable.Export(e, i.toString()))
            };
        }

        // Export exportable
        if(object instanceof Exportable)
        {
            return {
                Name: name,
                Class: object.constructor.name,
                Payload: object.ExportAll()
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
     * Import a property.
     * @param input 
     */
    protected ImportProperty(input: IExportObject): any
    {
        return Exportable.Import(input);
    }

    /**
     * Import all properties.
     * @param input 
     */
    public ImportAll(input: IExportObject[]): void
    {
        input instanceof Array && input.forEach(element =>
        {
            const imported = this.ImportProperty(element);

            if(imported !== undefined)
            {
                this[element.Name] = imported;
            }
        });
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

        instance && instance.ImportAll(input.Payload);

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
     * Shallow merge two exported objects.
     * @param target Other gonna be merged here!
     * @param other 
     */
    public static Merge(target: IExportObject, other: IExportObject): void
    {
        if(!target || !target.Payload || !target.Payload.length)
        {
            return;
        }

        const otherProps = this.ToDict(other)
        
        target.Payload.forEach((prop, i) => 
        {
            if(otherProps.hasOwnProperty(prop.Name))
            {
                target.Payload[i] = otherProps[prop.Name];
            }
        });
    }

    /**
     * Convert an IExportObject to dictionary.
     * Class property gonna be lost!
     * @param obj 
     */
    public static ToDict(obj: IExportObject): { [id: string]: IExportObject }
    {
        const props = {};

        obj && obj.Payload && obj.Payload.length && 
            obj.Payload.forEach(p => props[p.Name] = p);

        return props;
    }
}