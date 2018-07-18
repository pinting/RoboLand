import { IExportObject } from "./IExportObject";

export abstract class Exportable
{
    /**
     * Create an instance of a class by name.
     * @param className 
     */
    public static FromName(className: string, ...args: any[]): Exportable
    {
        const find = (className): any =>
        {
            switch(className)
            {
                case "Coord":
                    return require("./Coord").Coord;
                case "GroundCell":
                    return require("./Element/Cell/GroundCell").GroundCell;
                case "StoneCell":
                    return require("./Element/Cell/StoneCell").StoneCell;
                case "WaterCell":
                    return require("./Element/Cell/WaterCell").WaterCell;
                case "PlayerActor":
                    return require("./Element/Actor/PlayerActor").PlayerActor;
                default:
                    return null;
            }
        };

        const classObj = find(className);

        return classObj && new classObj(...args);
    }

    /**
     * Export a property.
     * @param name
     * @param object 
     */
    protected ExportProperty(object: any, name: string): IExportObject
    {
        return Exportable.Export(object, name);
    }

    /**
     * Export all properties.
     */
    public ExportAll(): IExportObject[]
    {
        const result: IExportObject[] = [];

        for (let property in this)
        {
            const exported = this.ExportProperty(this[property], property);

            if(exported)
            {
                result.push(exported);
            }
        }

        return result;
    }

    /**
     * Export 
     * @param name 
     * @param object 
     */
    public static Export(object: any, name: string = null): IExportObject
    {
        // Export each element of an array
        if(object instanceof Array)
        {
            return {
                Name: name,
                Class: object.constructor.name,
                Payload: object.map((e, i) => e instanceof Exportable 
                    ? e.ExportProperty(e, i.toString()) 
                    : Exportable.Export(e, i.toString()))
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
        return Exportable.Import(input, this);
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

            if(imported)
            {
                this[element.Name] = imported;
            }
        });
    }

    /**
     * Create a whole object.
     * @param input 
     */
    public static Import(input: IExportObject, self: Exportable = null): any
    {
        // Import array
        if(input.Class == "Array")
        {
            return input.Payload.map(e => self instanceof Exportable 
                ? self.ImportProperty(e)
                : Exportable.Import(e, self));
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
}