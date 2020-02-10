import { Vector } from "../Geometry/Vector";
import { Tools } from "../Util/Tools";
import { World } from "../World";
import { Exportable, ExportType } from "../Exportable";
import { IDump } from "../IDump";
import { Logger } from "../Util/Logger";
import { Body } from "../Physics/Body";
import { ICollision } from "../Physics/ICollision";

export interface UnitArgs
{
    ignore?: boolean;
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
    
    @Exportable.Register(ExportType.Net)
    protected ignore: boolean;

    @Exportable.Register(ExportType.Net, (s, v) => s.Dispose(v))
    protected disposed: boolean = false;
    
    @Exportable.Register(ExportType.Net)
    protected id: string;

    @Exportable.Register(ExportType.Net)
    protected parent: string; // ID of the parent unit

    @Exportable.Register(ExportType.NetDisk, (s, v) => s.SetBody(v))
    protected body: Body;

    @Exportable.Register(ExportType.NetDisk)
    protected texture: string;

    @Exportable.Register(ExportType.NetDisk)
    protected blocking: boolean;

    @Exportable.Register(ExportType.NetDisk)
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
        this.ignore = args.ignore === undefined ? this.ignore || false : args.ignore;
        this.id = args.id === undefined ? this.id || Tools.Unique() : args.id;
        this.world = args.world === undefined ? this.world || World.Current : args.world;
        this.parent = args.parent === undefined ? this.parent || (this.world && this.world.Origin) : args.parent;
        this.texture = args.texture === undefined ? this.texture : args.texture;
        this.blocking = args.blocking === undefined ?  this.blocking || false : args.blocking;
        this.light = args.light === undefined ? this.light || 0 : args.light;
    }

    /**
     * For function setters.
     * @param args 
     */
    protected InitPost(args: UnitArgs = {})
    {
        this.SetBody(args.body || this.body);
        
        if(!this.ignore && this.world && !this.tickEvent)
        {
            this.tickEvent = this.world.OnTick.Add(dt => this.OnTick(dt));
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
        this.body.Validate = (scale, rotation, position) => 
        {
            if(!this.ignore && this.world)
            {
                this.world.OnUpdate.Call(this);
            }

            return this.ValidateBody(scale, rotation, position);
        }
    }

    protected ValidateBody(scale: Vector, rotation: Number, position: Vector): boolean
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

        if(!this.ignore && this.world)
        {
            this.world.OnTick.Remove(this.tickEvent);
        }

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