import { Vector } from "../Geometry/Vector";
import { Tools } from "../Util/Tools";
import { World } from "../World";
import { Exportable, ExportType } from "../Exportable";
import { IDump } from "../IDump";
import { Logger } from "../Util/Logger";
import { Body } from "../Physics/Body";
import { Polygon } from "../Geometry/Polygon";
import { ICollision } from "../Physics/ICollision";

export interface UnitArgs
{
    id?: string;
    texture?: string;
    parent?: string;
    world?: World;
    body?: Body;
    blocking?: boolean;
    light?: number;
}

export abstract class Unit extends Exportable
{
    protected world: World;
    protected tickEvent: number;
    
    @Exportable.Register(ExportType.Visible)
    protected template: string;

    @Exportable.Register(ExportType.Hidden, (s, v) => s.Dispose(v))
    protected disposed: boolean = false;
    
    @Exportable.Register(ExportType.Hidden)
    protected id: string;

    @Exportable.Register(ExportType.Hidden)
    protected parent: string; // ID of the parent unit

    @Exportable.Register(ExportType.Visible, (s, v) => s.SetBody(v))
    protected body: Body;

    @Exportable.Register(ExportType.Visible)
    protected texture: string;

    @Exportable.Register(ExportType.Visible)
    protected blocking: boolean;

    @Exportable.Register(ExportType.Visible)
    protected light: number;

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
        this.texture = args.texture;
        this.blocking = args.blocking || false;
        this.light = args.light || 0;
    }

    /**
     * For function setters.
     * @param args 
     */
    protected InitPost(args: UnitArgs = {})
    {
        this.SetBody(args.body);
        
        this.world && (this.tickEvent = this.world.OnTick.Add(dt => this.OnTick(dt)));
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
     * Get the body of the unit.
     */
    public GetBody(): Body
    {
        return this.body;
    }

    /**
     * Set the body and generate the virtual body.
     * VirtualBody = Body.Rotate(Angle).Add(Position)
     * @param body 
     */
    public SetBody(body?: Body): void
    {
        if(!body)
        {
            return;
        }

        this.body = body;
        this.body.Validate = (scale, rotation, offset) => 
        {
            this.world.OnUpdate.Call(this);

            return this.ValidateBody(scale, rotation, offset);
        }
    }

    protected ValidateBody(scale: Vector, rotation: Number, offset: Vector): boolean
    {
        return true;
    }
    
    public GetLight(): number
    {
        return this.light;
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

        Logger.Info(this, "Unit was disposed!", this);
    }

    /**
     * @inheritDoc
     */
    public Import(input: IDump[]): void
    {
        this.InitPre();
        super.Import(input);
        this.InitPost();
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

        if(!this.blocking || !unit.blocking)
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
    
    /**
     * Called by the map every tick
     * @param dt The amount of time passed since the last tick
     */
    protected OnTick(dt: number)
    {
        return;
    }
}