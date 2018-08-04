import { Coord } from "../Coord";
import { Helper } from "../Util/Helper";
import { Map } from "../Map";
import { Exportable } from "../Exportable";
import { IExportObject } from "../IExportObject";

export abstract class BaseElement extends Exportable
{
    private tickEvent: number;

    protected map: Map = Map.Current;
    protected disposed: boolean = false;
    protected tag: string;
    protected position: Coord;
    protected size: Coord;
    protected texture: string;

    /**
     * Constructor of the BaseElement.
     * @param init.map
     * @param init.position
     * @param init.size
     * @param init.texture
     */
    public constructor(init: {
        position?: Coord, 
        size?: Coord, 
        texture?: string } = {})
    {
        super();

        // Generate unique tag for the element
        this.tag = Helper.Unique();

        // Use direct assignment
        this.size = init.size;
        this.texture = init.texture;

        // Use setters
        this.Position = init.position;

        // Start to listen to the tick event
        this.tickEvent = this.map.OnTick.Add(() => this.OnTick());
    }

    /**
     * Get the tag of the element.
     */
    public get Tag(): string
    {
        return this.tag;
    }

    /**
     * Get the size of the element.
     */
    public get Size(): Coord
    {
        return this.size.Clone();
    }

    /**
     * Get the texture of the element.
     */
    public get Texture(): string
    {
        return this.texture;
    }

    /**
     * Set the position of the element.
     * @param position 
     */
    public set Position(position: Coord)
    {
        this.position = position;
    }

    /**
     * Get the position of the element.
     */
    public get Position(): Coord
    {
        return this.position && this.position.Clone();
    }

    /**
     * Set the value of disposed. Can only be flipped once.
     * @param value
     */
    public set Disposed(value: boolean)
    {
        if(this.disposed || !value)
        {
            return;
        }

        this.disposed = true;
        this.map.OnTick.Remove(this.tickEvent);
    }

    /**
     * Get value of disposed.
     */
    public get Disposed(): boolean
    {
        return this.disposed;
    }

    /**
     * @inheritDoc
     */
    public ExportProperty(name: string): IExportObject
    {
        // Filter what to export
        switch(name)
        {
            case "map":
            case "tickEvent":
                return undefined;
            default:
                return super.ExportProperty(name);
        }
    }

    /**
     * @inheritDoc
     */
    public ImportProperty(input: IExportObject): any
    {
        const value = super.ImportProperty(input);

        // Handle setters manually
        switch(name)
        {
            case "position":
                this.Position = value;
                return undefined;
            case "disposed":
                this.Disposed = value;
                return undefined;
            default:
                return value;
        }
    }
    
    /**
     * Called upon tick.
     */
    protected abstract OnTick(): void;
}