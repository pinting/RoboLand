import { Coord } from "../Coord";
import { Utils } from "../Utils";
import { Map } from "../Map";
import { Exportable } from "../Exportable";
import { IExportObject } from "../IExportObject";

export abstract class BaseElement extends Exportable
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
        super();

        this.disposed = false;
        this.position = position || new Coord;
        this.tag = Utils.Unique();
    }

    /**
     * Override export prop function for optimization.
     * @param name 
     * @param object 
     */
    protected ExportProperty(object: any, name: string): IExportObject
    {
        // Export element
        if(object instanceof BaseElement)
        {
            return {
                Name: name,
                Class: object.constructor.name,
                Payload: object.GetTag()
            };
        }

        return super.ExportProperty(object, name);
    }

    /**
     * Override import prop function for optimization.
     * @param name 
     * @param object 
     */
    protected ImportProperty(element: IExportObject): any
    {
        // Import element
        if(element.Class != "string" && Utils.IsUnique(element.Payload))
        {
            return this.map.GetElements().Get(element.Payload)[0];
        }

        return super.ImportProperty(element);
    }

    /**
     * Get the tag of the element.
     */
    public GetTag(): string
    {
        return this.tag;
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
    abstract GetPos(): Coord;
}