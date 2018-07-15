import { ElementType } from "./ElementType";
import { Coord } from "../Coord";
import { Utils } from "../Utils";
import { IExportable } from "../IExportable";
import { Map } from "../Map";
import { ExportType } from "./ExportType";
import { IElementExport } from "./IElementExport";

export abstract class BaseElement implements IExportable
{
    protected readonly map = Map.GetInstance();

    protected disposed: boolean;
    protected position: Coord;
    protected tag: string;

    /**
     * Constructor of the BaseElement.
     * @param position
     */
    public constructor(position: Coord = null)
    {
        this.disposed = false;
        this.position = position || new Coord;
        this.tag = Utils.Unique();
    }

    /**
     * Get the tag of the element.
     */
    public GetTag(): string
    {
        return this.tag;
    }

    /**
     * Export the element.
     */
    public Export(): string
    {
        const parse = (name: string | number, object: Object) =>
        {
            // Export each element of an array
            if(object instanceof Array)
            {
                // Using the TOP logic, so the optimization applies
                return {
                    Name: name,
                    Type: ExportType.Array,
                    Payload: object.map((e, i) => parse(i, e))
                };
            }

            // Optimze, do not send other elements included only tags
            if(object instanceof BaseElement)
            {
                return {
                    Name: name,
                    Type: ExportType.Unique,
                    Payload: object.GetTag()
                };
            }

            // Export coord
            if(object instanceof Coord)
            {
                return {
                    Name: name,
                    Type: ExportType.Coord,
                    Payload: object.Export()
                };
            }

            // Export string
            if(typeof object === "string")
            {
                return {
                    Name: name,
                    Type: ExportType.String,
                    Payload: object
                };
            }

            // Export number
            if(typeof object === "number")
            {
                return {
                    Name: name,
                    Type: ExportType.Num,
                    Payload: object
                };
            }

            return null;
        };

        const result: IElementExport[] = [];

        for (var property in this) 
        {
            const exported = parse(property, this[property]);

            if(exported)
            {
                result.push(exported);
            }
        }

        return JSON.stringify(result);
    }

    /**
     * Import an element.
     */
    public Import(input: string): boolean
    {
        let parsed: IElementExport[];

        try 
        {
            parsed = JSON.parse(input);

            if(!parsed || !parsed.length)
            {
                return false;
            }
        }
        catch(e)
        {
            return false;
        }

        const parse = (element: IElementExport) =>
        {
            if(element.Type == ExportType.Array)
            {
                return element.Payload.map(e => parse(e));
            }

            if(element.Type == ExportType.Coord)
            {
                const coord = new Coord;

                coord.Import(element.Payload);

                return coord;
            }

            if(element.Type == ExportType.Unique)
            {
                return this.map.GetElements().Get(element.Payload);
            }
            
            return element.Payload;
        };

        parsed.forEach(element =>
        {
            this[element.Name] = parse(element);
        });

        return true;
    }

    /**
     * Check if the element is disposed.
     */
    public IsDisposed(): boolean
    {
        return this.disposed;
    }

    /**
     * Dispose the element.
     */
    public Dispose(): void
    {
        if(this.disposed)
        {
            return;
        }

        this.disposed = true;
    }
    
    abstract GetSize(): Coord;
    abstract GetTexture(): string;
    abstract GetType(): ElementType;
    abstract GetPos(): Coord;
}