import { Vector } from "../Geometry/Vector";
import { Tools } from "../Util/Tools";
import { World } from "../World";
import { Exportable, ExportType } from "../Exportable";
import { IDump } from "../IDump";
import { Logger } from "../Util/Logger";
import { Body } from "../Physics/Body";
import { Polygon } from "../Geometry/Polygon";
import { IContact } from "../Geometry/IContact";
import { ICollision } from "../Physics/ICollision";

export interface UnitArgs
{
    id?: string;
    position?: Vector; 
    size?: Vector;
    texture?: string;
    parent?: string;
    world?: World;
    angle?: number;
    body?: Body;
    blocking?: boolean;
}

export abstract class Unit extends Exportable
{
    protected world: World;
    protected tickEvent: number;

    @Exportable.Register(ExportType.Hidden, (s, v) => s.Dispose(v))
    protected disposed: boolean = false;
    
    @Exportable.Register(ExportType.Hidden)
    protected id: string;

    @Exportable.Register(ExportType.Hidden)
    protected parent: string; // ID of the parent unit

    @Exportable.Register(ExportType.Visible)
    protected size: Vector;

    @Exportable.Register(ExportType.Visible, (s, v) => s.SetBody(v))
    protected body: Body;

    @Exportable.Register(ExportType.Visible, (s, v) => s.SetPosition(v))
    protected position: Vector;

    @Exportable.Register(ExportType.Visible, (s, v) => s.SetAngle(v))
    protected angle: number;

    @Exportable.Register(ExportType.Visible)
    protected texture: string;

    @Exportable.Register(ExportType.Visible)
    protected blocking: boolean;

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
     * For direct assignments. This will be called first!
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
        this.blocking = args.blocking || false;

        this.world && (this.tickEvent = this.world.OnTick.Add(dt => this.OnTick(dt)));
    }

    /**
     * For function setters.
     * @param args 
     */
    protected InitPost(args: UnitArgs = {})
    {
        this.SetPosition(args.position);
        this.SetBody(args.body);
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
        if(!this.position || !this.size)
        {
            throw new Error("Get center failed, no position or size!");
        }

        return this.position.Add(this.size.Scale(0.5));
    }

    /**
     * Get the radius of the unit.
     */
    public GetRadius(): number
    {
        if(!this.size)
        {
            throw new Error("Get radius failed, no size!");
        }

        return Math.sqrt(Math.pow(this.size.X, 2) + Math.pow(this.size.Y, 2)) / 2;
    }

    public GetSize(): Vector
    {
        return this.size;
    }

    /**
     * Get the position of the unit.
     */
    public GetPosition(): Vector
    {
        if(!this.position)
        {
            throw new Error("Get position failed, no position!");
        }

        return this.position.Clone();
    }

    /**
     * Set the position of the unit.
     * @param position 
     */
    public SetPosition(position: Vector): boolean
    {
        if(position && 
            this.position && 
            this.position.Is(position) &&
            position === this.position)
        {
            return false;
        }

        this.position = position;

        this.body && this.body.SetVirtual(null, null, position);
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
        
        this.body && this.body.SetVirtual(null, angle, null);
        this.world && this.world.OnUpdate.Call(this);

        return true;
    }

    protected BodyFactory()
    {
        return new Body([
            new Polygon([
                new Vector(-0.5, 0.5),
                new Vector(0.5, 0.5),
                new Vector(0.5, -0.5),
                new Vector(-0.5, -0.5)
            ])
        ]);
    }

    /**
     * Get the body of the unit.
     */
    public GetBody(): Body
    {
        if(!this.size)
        {
            return null;
        }

        // Default body
        if(!this.body)
        {
            this.SetBody(this.BodyFactory());
        }

        return this.body;
    }

    /**
     * Set the body and generate the virtual body.
     * VirtualBody = Body.Rotate(Angle).Add(Position)
     * @param body 
     */
    public SetBody(body: Body): void
    {
        if(!body)
        {
            return;
        }

        this.body = body;
        this.body.SetVirtual(Math.max(this.size.X, this.size.Y), this.angle, this.position);

        this.body.OnChange = (scale, rotation, offset) => 
        {
            rotation && (this.angle = rotation);
            offset && (this.position = offset);
        }
    }
    
    public IsBlocking(): boolean
    {
        return this.blocking;
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
        this.world && this.world.OnTick.Remove(this.tickEvent);

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
    public Collide(unit: Unit): ICollision
    {
        if(unit == this || unit.GetId() == this.GetId())
        {
            return null;
        }

        const dist = this.GetCenter().Dist(unit.GetCenter());

        // Optimize, if unit is too far away, skip deeper collision detection
        if(dist > this.GetRadius() + unit.GetRadius())
        {
            return null;
        }

        return this.GetBody().Collide(unit.GetBody());
    }

    /**
     * Clone this unit.
     */
    public Clone(): Unit
    {
        const current = World.Current;
        let clone: Unit;

        // Clones should have a world,
        // it could cause circular invocation 
        World.Current = null;
        clone = <Unit>super.Clone();
        World.Current = current;

        return clone;
    }
    
    protected OnTick(dt: number)
    {
        return;
    }
}