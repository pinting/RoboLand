import { Coord } from "../Coord";
import { Helper } from "../Util/Helper";
import { Map } from "../Map";
import { Exportable } from "../Exportable";
import { IExportObject } from "../IExportObject";

export abstract class BaseElement extends Exportable
{
    protected readonly map: Map;

    protected disposed: boolean;
    protected position: Coord;
    protected tag: string;

    /**
     * Constructor of the BaseElement. Abstract!
     * @param position
     */
    public constructor(position: Coord = null, map: Map = null)
    {
        super();

        this.position = position || new Coord;
        this.map = map || Map.GetInstance();
        
        this.disposed = false;
        this.tag = Helper.Unique();
    }

    /**
     * Get the tag of the element.
     */
    public GetTag(): string
    {
        return this.tag;
    }

    /**
     * Override import all to handle removal from the map.
     * @param input
     */
    public ImportAll(input: IExportObject[]): void
    {
        super.ImportAll(input);

        if(this.disposed)
        {
            // In BaseElement this makes no sense,
            // but in its childs the element needs
            // to be removed from the map
            this.Dispose();
        }
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
        this.disposed = true;
    }
    
    public abstract GetSize(): Coord;
    public abstract GetTexture(): string;
    public abstract GetPos(): Coord;
}