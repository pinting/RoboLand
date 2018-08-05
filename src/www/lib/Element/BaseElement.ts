import { Coord } from "../Coord";
import { Helper } from "../Util/Helper";
import { Map } from "../Map";
import { Exportable } from "../Exportable";
import { IExportObject } from "../IExportObject";

export interface BaseElementArgs
{
    position?: Coord; 
    size?: Coord;
    texture?: string;
}

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
     * Construct a new element with the given init args.
     * @param args
     */
    public constructor(args: BaseElementArgs = {})
    {
        super();

        // Generate unique tag for the element
        this.tag = Helper.Unique();

        // Use direct assignment
        this.size = args.size;
        this.texture = args.texture;

        // Use setter function
        this.SetPos(args.position);

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
     * Get the position of the element.
     */
    public get Position(): Coord
    {
        return this.position && this.position.Clone();
    }

    /**
     * Get value of disposed.
     */
    public get Disposed(): boolean
    {
        return this.disposed;
    }

    /**
     * Set the position of the element.
     * @param position 
     */
    protected SetPos(position: Coord): boolean
    {
        this.position = position;
        this.map.OnUpdate.Call(this);

        return true;
    }

    /**
     * Set the value of disposed. Can only be set once.
     * @param value
     */
    public Dispose(value: boolean = true)
    {
        if(this.disposed || !value)
        {
            return;
        }

        this.disposed = true;
        this.map.OnTick.Remove(this.tickEvent);
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
                this.SetPos(value);
                return undefined;
            case "disposed":
                this.Dispose(value);
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