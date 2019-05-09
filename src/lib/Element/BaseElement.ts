import { Vector } from "../Physics/Vector";
import { Tools } from "../Util/Tools";
import { Board } from "../Board";
import { Exportable, ExportType } from "../Exportable";
import { IExportObject } from "../IExportObject";
import { Logger } from "../Util/Logger";
import { Mesh } from "../Physics/Mesh";
import { Triangle } from "../Physics/Triangle";
import { IMTVector } from "../Physics/IMTVector";

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
    protected origin: string; // ID of the parent element

    @Exportable.Register(ExportType.User)
    protected size: Vector;

    @Exportable.Register(ExportType.User, (s, v) => s.SetMesh(v))
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
        this.origin = args.origin || this.board && this.board.Origin;
        this.size = args.size;
        this.texture = args.texture;
        this.angle = args.angle || 0;
    }

    /**
     * For function setters.
     * @param args 
     */
    protected InitPost(args: BaseElementArgs = {})
    {
        this.SetPosition(args.position);
        this.SetMesh(args.mesh);
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
     * Get the center position of the element.
     */
    public GetCenter(): Vector
    {
        return this.position && this.size && this.position.Add(this.size.F(v => v / 2));
    }

    /**
     * Get the radius of the element.
     * radius = max(width, height)
     */
    public GetRadius(): number
    {
        return this.size && Math.sqrt(Math.pow(this.size.X, 2) + Math.pow(this.size.Y, 2)) / 2;
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
        if(!this.size)
        {
            return null;
        }

        return this.mesh || (this.mesh = new Mesh([
            new Triangle([
                new Vector(0, 0),
                new Vector(this.size.X, 0),
                new Vector(0, this.size.Y)
            ]),
            new Triangle([
                new Vector(this.size.X, 0),
                new Vector(this.size.X, this.size.Y),
                new Vector(0, this.size.Y)
            ])
        ]));
    }

    /**
     * Get the virtual mesh of the element.
     */
    public GetVirtualMesh(): Mesh
    {
        if(!this.position)
        {
            return null;
        }
        
        return this.virtualMesh || (this.virtualMesh = this.GetMesh() && 
            this.GetMesh().F(v => v
                .Add(this.position)
                .Rotate(this.angle, this.GetCenter()))
        );
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
        this.virtualMesh = null;
            
        this.GetVirtualMesh();
        this.board && this.board.OnUpdate.Call(this);

        return true;
    }

    /**
     * Set the angle of the element.
     * @param angle Angle in deg
     */
    public SetAngle(angle: number): boolean
    {
        if(typeof angle != "number")
        {
            return false;
        }

        this.angle = angle;
        this.virtualMesh = null;

        this.GetVirtualMesh();
        this.board && this.board.OnUpdate.Call(this);

        return true;
    }

    /**
     * Set the mesh and generate the virtual hash.
     * Virtual = Mesh -> Rotate(Angle) ->  Add(Position)
     * @param mesh 
     */
    public SetMesh(mesh: Mesh): void
    {
        if(!mesh)
        {
            return;
        }

        this.mesh = mesh;
        this.virtualMesh = null;

        this.GetVirtualMesh();
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
        this.Init();
        super.Import(input);
    }

    /**
     * Check if the element collides with another.
     * @param element 
     */
    public Collide(element: BaseElement): IMTVector
    {
        if(element == this)
        {
            return null;
        }

        const dist = this.GetCenter().Dist(element.GetCenter());

        if(dist >= this.GetRadius() + element.GetRadius())
        {
            return null;
        }

        const b = element.GetVirtualMesh();
        const a = this.GetVirtualMesh();
        const r = a.Collide(b);

        return r;
    }

    /**
     * Clone this element.
     */
    public Clone(): BaseElement
    {
        const current = Board.Current;
        let clone: BaseElement;

        Board.Current = null;
        clone = Exportable.Import(Exportable.Export(this));
        Board.Current = current;

        return clone;
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