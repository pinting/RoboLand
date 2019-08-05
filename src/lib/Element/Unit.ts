import { Vector } from "../Geometry/Vector";
import { Tools } from "../Util/Tools";
import { World } from "../World";
import { Exportable, ExportType } from "../Exportable";
import { IDump } from "../IDump";
import { Logger } from "../Util/Logger";
import { Mesh } from "../Geometry/Mesh";
import { Triangle } from "../Geometry/Triangle";
import { IMTVector } from "../Geometry/IMTVector";

export interface UnitArgs
{
    id?: string;
    position?: Vector; 
    size?: Vector;
    texture?: string;
    parent?: string;
    world?: World;
    angle?: number;
    mesh?: Mesh;
}

export abstract class Unit extends Exportable
{
    protected world: World;
    protected virtualMesh: Mesh;
    protected tickEvent: number;

    @Exportable.Register(ExportType.Hidden, (s, v) => s.Dispose(v))
    protected disposed: boolean = false;
    
    @Exportable.Register(ExportType.Hidden)
    protected id: string;

    @Exportable.Register(ExportType.Hidden)
    protected parent: string; // ID of the parent unit

    @Exportable.Register(ExportType.Visible)
    protected size: Vector;

    @Exportable.Register(ExportType.Visible, (s, v) => s.SetMesh(v))
    protected mesh: Mesh;

    @Exportable.Register(ExportType.Visible, (s, v) => s.SetPosition(v))
    protected position: Vector;

    @Exportable.Register(ExportType.Visible)
    protected texture: string;

    @Exportable.Register(ExportType.Visible)
    protected angle: number;

    /**
     * Construct a new unit with the given init args.
     * @param args
     */
    public Init(args: UnitArgs = {})
    {
        this.InitPre(args);
        this.InitPost(args);
    }

    /**
     * For direct assignments.
     * This will be called first!
     * @param args 
     */
    protected InitPre(args: UnitArgs = {})
    {
        this.id = args.id || Tools.Unique();
        this.world = args.world || World.Current;
        this.parent = args.parent || (this.world && this.world.Origin);
        this.size = args.size;
        this.texture = args.texture;
        this.angle = args.angle || 0;
    }

    /**
     * For function setters.
     * @param args 
     */
    protected InitPost(args: UnitArgs = {})
    {
        this.SetPosition(args.position);
        this.SetMesh(args.mesh);

        if(this.world)
        {
            // Start to listen to the tick event
            this.tickEvent = this.world.OnTick.Add(() => this.OnTick());
    
            Logger.Info(this, "Tick event was set", this);
        }
    }

    /**
     * Get the id of the unit.
     */
    public GetId(): string
    {
        return this.id;
    }

    /**
     * Get the parent of the unit.
     */
    public GetParent(): string
    {
        return this.parent;
    }

    /**
     * Get the size of the unit.
     */
    public GetSize(): Vector
    {
        return this.size.Clone();
    }

    /**
     * Get the texture of the unit.
     */
    public GetTexture(): string
    {
        return this.texture;
    }

    /**
     * Get the center position of the unit.
     */
    public GetCenter(): Vector
    {
        return this.position && this.size && this.position.Add(this.size.F(v => v / 2));
    }

    /**
     * Get the radius of the unit.
     * radius = max(width, height)
     */
    public GetRadius(): number
    {
        return this.size && Math.sqrt(Math.pow(this.size.X, 2) + Math.pow(this.size.Y, 2)) / 2;
    }

    /**
     * Get the position of the unit.
     */
    public GetPosition(): Vector
    {
        return this.position && this.position.Clone();
    }

    /**
     * Set the position of the unit.
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
        this.world && this.world.OnUpdate.Call(this);

        return true;
    }

    /**
     * Get the angle of the unit.
     */
    public GetAngle(): number
    {
        return this.angle;
    }

    /**
     * Set the angle of the unit.
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
        this.world && this.world.OnUpdate.Call(this);

        return true;
    }

    /**
     * Get the mesh of the unit.
     */
    protected GetMesh(): Mesh
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
     * Get the virtual mesh of the unit.
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
     * Get value of disposed.
     */
    public IsDisposed(): boolean
    {
        return this.disposed;
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
    public Import(input: IDump[]): void
    {
        this.Init();
        super.Import(input);
    }

    /**
     * Check if the unit collides with another.
     * @param unit 
     */
    public Collide(unit: Unit): IMTVector
    {
        if(unit == this || unit.GetId() == this.GetId())
        {
            return null;
        }

        const dist = this.GetCenter().Dist(unit.GetCenter());

        if(dist >= this.GetRadius() + unit.GetRadius())
        {
            return null;
        }

        return this.GetVirtualMesh().Collide(unit.GetVirtualMesh());
    }

    /**
     * Clone this unit.
     */
    public Clone(): Unit
    {
        const current = World.Current;
        let clone: Unit;

        World.Current = null;
        clone = <Unit>super.Clone();
        World.Current = current;

        return clone;
    }

    protected OnTick(): void
    {
        return;
    }
}