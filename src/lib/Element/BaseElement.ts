import { Coord } from "../Coord";
import { Utils } from "../Tools/Utils";
import { Board } from "../Board";
import { Exportable } from "../Exportable";
import { IExportObject } from "../IExportObject";
import { Logger } from "../Tools/Logger";

export interface BaseElementArgs
{
    id?: string;
    position?: Coord; 
    size?: Coord;
    texture?: string;
    origin?: string;
    board?: Board;
}

export abstract class BaseElement extends Exportable
{
    protected board: Board;

    protected _disposed: boolean = false;
    protected _id: string;
    protected _origin: string; // ID of the origin element

    protected $position: Coord;
    protected $size: Coord;
    protected $texture: string;

    /**
     * Construct a new element with the given init args.
     * @param args
     */
    public Init(args: BaseElementArgs = {})
    {
        this.InitPre(args);
        this.InitPost(args);
    }

    /**
     * For direct assignments.
     * This will be called first!
     * @param args 
     */
    protected InitPre(args: BaseElementArgs = {})
    {
        this._id = args.id || Utils.Unique();
        this.board = args.board || Board.Current;
        this._origin = args.origin || this.board.Origin;
        this.$size = args.size;
        this.$texture = args.texture;
    }

    /**
     * For function setters.
     * @param args 
     */
    protected InitPost(args: BaseElementArgs = {})
    {
        args.position && this.SetPos(args.position);
    }

    /**
     * Get the id of the element.
     */
    public get Id(): string
    {
        return this._id;
    }

    /**
     * Get the origin of the element.
     */
    public get Origin(): string
    {
        return this._origin;
    }

    /**
     * Get the $size of the element.
     */
    public get Size(): Coord
    {
        return this.$size.Clone();
    }

    /**
     * Get the $texture of the element.
     */
    public get Texture(): string
    {
        return this.$texture;
    }

    /**
     * Get the $position of the element.
     */
    public get Position(): Coord
    {
        return this.$position && this.$position.Clone();
    }

    /**
     * Get value of disposed.
     */
    public get Disposed(): boolean
    {
        return this._disposed;
    }

    /**
     * Set the $position of the element.
     * @param position 
     */
    public SetPos(position: Coord): boolean
    {
        if((position && this.$position && this.$position.Is(position)) &&
            (position === this.$position))
        {
            return false;
        }

        this.$position = position;
        this.board.OnUpdate.Call(this);

        return true;
    }

    /**
     * Set the value of disposed. Can only be set once.
     * @param value
     */
    public Dispose(value: boolean = true)
    {
        if(this._disposed || !value)
        {
            return;
        }

        this._disposed = true;

        Logger.Info(this, "Element was disposed!", this);
    }

    /**
     * @inheritDoc
     */
    public ImportProperty(input: IExportObject): any
    {
        const value = super.ImportProperty(input);

        // Handle setters manually
        switch(input.Name)
        {
            case "_position":
                this.SetPos(value);
                return undefined;
            case "_disposed":
                this.Dispose(value);
                return undefined;
            default:
                return value;
        }
    }

    /**
     * @inheritDoc
     */
    public ImportAll(input: IExportObject[]): void
    {
        this.InitPre();
        super.ImportAll(input);
        this.InitPost();
    }

    /**
     * Compare two export objects using a diff.
     * @param diff
     * @returns Return true if only $position or direction is different.
     */
    public static IsOnlyPosDiff(diff: IExportObject): boolean
    {
        const props = Exportable.Dict(diff);

        // No diff
        if(Object.keys(props).length == 0)
        {
            return true;
        }

        // Only $position diff
        if(Object.keys(props).length === 1 &&
            props.hasOwnProperty("position"))
        {
            return true;
        }

        // Only direction diff
        if(Object.keys(props).length === 1 &&
            props.hasOwnProperty("direction"))
        {
            return true;
        }

        // Only $position and direction diff
        if(Object.keys(props).length === 2 &&
            props.hasOwnProperty("position") &&
            props.hasOwnProperty("direction"))
        {
            return true;
        }

        return false;
    }
}