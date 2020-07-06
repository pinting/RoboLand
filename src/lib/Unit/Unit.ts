import { Vector } from "../Geometry/Vector";
import { World } from "../World";
import { Exportable, ExportType, IExportableArgs } from "../Exportable";
import { Logger } from "../Util/Logger";
import { Body } from "../Physics/Body";
import { Collision } from "../Physics/Collision";

export interface UnitArgs extends IExportableArgs
{
    ignore?: boolean;
    texture?: string;
    parent?: string;
    world?: World;
    body?: Body;
    blocking?: boolean;
    light?: number;
}

export abstract class Unit extends Exportable
{
    protected world: World = World.Current;
    protected tickEvent: number;
    
    @Exportable.Register(ExportType.All)
    protected ignore: boolean;

    @Exportable.Register(ExportType.Net + ExportType.Thread, (s, v) => s.Dispose(v))
    protected disposed: boolean = false;

    @Exportable.Register(ExportType.Net + ExportType.Thread)
    protected parent: string = this.world && this.world.Origin; // ID of the parent unit

    @Exportable.Register(ExportType.All, (s, v) => s.SetBody(v))
    protected body: Body;

    @Exportable.Register(ExportType.All)
    protected texture: string;

    @Exportable.Register(ExportType.All)
    protected blocking: boolean = false;

    @Exportable.Register(ExportType.All)
    protected light: number = 0;

    public Init(args: UnitArgs = {})
    {
        this.InitPre(args);
        this.InitPost(args);
    }

    protected InitPre(args: UnitArgs = {})
    {
        this.ignore = args.ignore === undefined ? this.ignore || false : args.ignore;
        this.id = args.id === undefined ? this.id : args.id;
        this.world = args.world === undefined ? this.world : args.world;
        this.parent = args.parent === undefined ? this.parent || (this.world && this.world.Origin) : args.parent;
        this.texture = args.texture === undefined ? this.texture : args.texture;
        this.blocking = args.blocking === undefined ?  this.blocking : args.blocking;
        this.light = args.light === undefined ? this.light : args.light;
    }
    
    protected InitPost(args: UnitArgs = {})
    {
        this.SetBody(args.body || this.body);
        
        if(!this.ignore && this.world && !this.tickEvent)
        {
            this.tickEvent = this.world.OnTick.Add(dt => this.OnTick(dt));
        }
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
     * VirtualBody = Body.Scale(Size).Rotate(Angle).Add(Position)
     * @param body 
     */
    public SetBody(body?: Body): void
    {
        if(!body)
        {
            return;
        }

        this.body = body;
        this.body.OnChange = this.OnBodyChange.bind(this);
    }

    protected OnBodyChange(scale: Vector, rotation: Number, position: Vector): void
    {
        if(!this.ignore && this.world)
        {
            this.world.OnUpdate.Call(this);
        }
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
     * Check if the unit collides with another.
     * @param unit 
     */
    public Collide(unit: Unit): Collision
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

        // Clones should have a world,
        // it could cause circular invocation 
        World.Current = null;
        
        const clone = super.Clone();

        World.Current = current;

        return clone as Unit;
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