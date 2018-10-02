import { IExportObject } from "./IExportObject";

export abstract class Exportable
{
    private static registeredClasses: { [name: string]: any } = {};

    /**
     * Register a class with a name.
     * @param name 
     * @param classObj 
     */
    public static Register(name: string, classObj: any)
    {
        Exportable.registeredClasses[name] = classObj;
    }
    
    /**
     * Create an instance of a class by name (using the registeredClasses classes).
     * @param className 
     */
    public static FromName<T extends Exportable>(name: string, ...args: any[]): T
    {
        const classObj = Exportable.registeredClasses[name] || null;

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
     * @param a 
     * @param b 
     * @param l Depth limit.
     */
    public static Diff(a: IExportObject, b: IExportObject, l: number = 3): IExportObject
    {
        if(!l || !a || !b || !a.Class || a.Class != b.Class || a.Name != b.Name)
        {
            return null;
        }

        switch(a.Class)
        {
            case "number":
            case "string":
            case "boolean":
                return a.Payload != b.Payload ? a : null;
            default:
                const diff: IExportObject[] = a.Payload
                    .map(ae => b.Payload.find(be => 
                        Exportable.Diff(ae, be, l - 1)))
                    .filter(ae => ae);

                return !diff.length ? null : {
                    Name: a.Name,
                    Class: a.Class,
                    Payload: diff
                };
        }
    }
}