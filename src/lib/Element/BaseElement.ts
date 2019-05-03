import { Vector } from "../Physics/Vector";
import { Tools } from "../Util/Tools";
import { Board } from "../Board";
import { Exportable, ExportType } from "../Exportable";
import { IExportObject } from "../IExportObject";
import { Logger } from "../Util/Logger";
import { Mesh } from "../Physics/Mesh";
import { Triangle } from "../Physics/Triangle";

export interface BaseElementArgs
{
    id?: string;
    position?: Vector; 
    size?: Vector;
    texture?: string;
    origin?: string;
    board?: Board;
    angle?: number;
    mesh?: Mesh;
}

export abstract class BaseElement extends Exportable
{
    protected board: Board;
    protected virtualMesh: Mesh;

    @Exportable.Register(ExportType.All, (s, v) => s.Dispose(v))
    protected disposed: boolean = false;
    
    @Exportable.Register(ExportType.All)
    protected id: string;

    @Exportable.Register(ExportType.All)
    protected origin: string; // ID of the origin element

    @Exportable.Register(ExportType.User)
    protected size: Vector;

    @Exportable.Register(ExportType.User, (s, v) => v && s.SetMesh(v))
    protected mesh: Mesh;

    @Exportable.Register(ExportType.User, (s, v) => s.SetPosition(v))
    protected position: Vector;

    @Exportable.Register(ExportType.User)
    protected texture: string;

    @Exportable.Register(ExportType.User)
    protected angle: number;


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
        this.id = args.id || Tools.Unique();
        this.board = args.board || Board.Current;
        this.origin = args.origin || this.board.Origin;
        this.size = args.size;
        this.texture = args.texture;
        this.angle = args.angle || 0;
        this.mesh = args.mesh || new Mesh([
            new Triangle([
                new Vector(0, 0),
                new Vector(1, 0),
                new Vector(0, 1)]),
            new Triangle([
                new Vector(1, 1),
                new Vector(1, 0),
                new Vector(0, 1)])
        ]);
    }

    /**
     * For function setters.
     * @param args 
     */
    protected InitPost(args: BaseElementArgs = {})
    {
        args.position && this.SetPosition(args.position);
    }

    /**
     * Get the id of the element.
     */
    public GetId(): string
    {
        return this.id;
    }

    /**
     * Get the origin of the element.
     */
    public GetOrigin(): string
    {
        return this.origin;
    }

    /**
     * Get the size of the element.
     */
    public GetSize(): Vector
    {
        return this.size.Clone();
    }

    /**
     * Get the texture of the element.
     */
    public GetTexture(): string
    {
        return this.texture;
    }

    /**
     * Get the position of the element.
     */
    public GetPosition(): Vector
    {
        return this.position && this.position.Clone();
    }

    /**
     * Get the angle of the element.
     */
    public GetAngle(): number
    {
        return this.angle;
    }

    /**
     * Get the mesh of the element.
     */
    public GetMesh(): Mesh
    {
        return this.mesh;
    }

    /**
     * Get the virtual mesh of the element.
     */
    public GetVirtualMesh(): Mesh
    {
        return this.virtualMesh;
    }

    /**
     * Get value of disposed.
     */
    public IsDisposed(): boolean
    {
        return this.disposed;
    }

    /**
     * Set the position of the element.
     * @param position 
     */
    public SetPosition(position: Vector): boolean
    {
        if((position && this.position && this.position.Is(position)) &&
            (position === this.position))
        {
            return false;
        }

        this.position = position;
        
        this.SetMesh(this.mesh);
        this.board.OnUpdate.Call(this);

        return true;
    }

    /**
     * Set the angle of the element.
     * @param angle Angle in deg
     */
    public SetAngle(angle: number): boolean
    {
        this.angle = angle;
        
        this.SetMesh(this.mesh);

        return true;
    }

    /**
     * Set the mesh and generate the virtual hash.
     * Virtual = Mesh -> Rotate(Angle) ->  Add(Position)
     * @param mesh 
     */
    public SetMesh(mesh: Mesh): void
    {
        this.mesh = mesh;
        this.virtualMesh = mesh.F(v => v
            .Rotate(this.angle, this.size.F(s => s / 2))
            .Add(this.position));
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

        Logger.Info(this, "Element was disposed!", this);
    }

    /**
     * @inheritDoc
     */
    public Import(input: IExportObject[]): void
    {
        this.InitPre();
        super.Import(input);
        this.InitPost();
    }

    /**
     * Compare two export objects using a diff.
     * @param diff
     * @returns Return true if only position or angle is different.
     */
    public static IsOnlyPosDiff(diff: IExportObject): boolean
    {
        const props = Exportable.Dict(diff);

        // No diff
        if(Object.keys(props).length == 0)
        {
            return true;
        }

        // Only position diff
        if(Object.keys(props).length === 1 &&
            props.hasOwnProperty("position"))
        {
            return true;
        }

        // Only angle diff
        if(Object.keys(props).length === 1 &&
            props.hasOwnProperty("angle"))
        {
            return true;
        }

        // Only position and angle diff
        if(Object.keys(props).length === 2 &&
            props.hasOwnProperty("position") &&
            props.hasOwnProperty("angle"))
        {
            return true;
        }

        return false;
    }
}