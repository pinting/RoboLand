import { Vector } from "../../Geometry/Vector";
import { Unit, UnitArgs } from "../Unit";
import { Exportable, ExportType } from "../../Exportable";

export interface BaseActorArgs extends UnitArgs
{
    mass?: number;
    force?: Vector;
}

export abstract class BaseActor extends Unit
{
    private lastTick: number = +new Date;

    @Exportable.Register(ExportType.Visible)
    protected mass: number;

    @Exportable.Register(ExportType.Visible)
    protected force: Vector;

    /**
     * @inheritDoc
     */
    protected InitPre(args: BaseActorArgs = {})
    {
        super.InitPre(args);

        this.mass = args.mass || 1;
        this.force = args.force || new Vector(0, 0);
    }

    /**
     * @inheritDoc
     */
    public SetPosition(position?: Vector): boolean
    {
        return position &&
            this.CanMove(position, this.angle) && 
            super.SetPosition(position);
    }

    /**
     * @inheritDoc
     */
    public SetAngle(angle?: number): boolean
    {
        return typeof angle === "number" && 
            this.CanMove(this.position, angle) && 
            super.SetAngle(angle);
    }

    /**
     * Check if the given position and angle will cause collision.
     * @param position 
     * @param angle 
     */
    private CanMove(position: Vector, angle: number): boolean
    {
        if(!this.world)
        {
            return true;
        }

        const clone = <BaseActor>this.Clone();

        clone.SetAngle(angle);
        clone.SetPosition(position);

        const actors = this.world.GetActors().FindCollisions(clone);

        if(actors.length)
        {
            return false;
        }

        // Get the currently covered cells and the next ones
        const prev = this.position 
            ? this.world.GetCells().FindCollisions(this)
            : [];
        
        const next = this.world.GetCells().FindCollisions(clone);

        if(!next.length)
        {
            return false;
        }

        // Remove intersection 
        const prevFiltered = prev.filter(v => !next.includes(v));
        const nextFiltered = next.filter(v => !prev.includes(v));

        // Check if one of the cells blocks the movement
        if(nextFiltered.some(cell => !cell.MoveHere(this)))
        {
            // If yes, revert all movement and return
            nextFiltered.forEach(v => v.MoveAway(this));
            return false;
        }

        // If it was successful, move away from the old cells
        prevFiltered.forEach(v => v.MoveAway(this));

        return true;
    }

    /**
     * @inheritDoc
     */
    public Dispose(value: boolean = true)
    {
        if(this.disposed || !value)
        {
            return;
        }

        this.world.GetActors().Remove(this);
        super.Dispose();
    }

    public GetAcceleration(): Vector
    {
        return this.force.F(n => n / this.mass);
    }

    public GetVelocity(t: number): Vector
    {
        return this.GetAcceleration().F(n => n * t);
    }

    public AddForce(vector: Vector): void
    {
        this.force.Add(vector);
    }

    protected OnTick(): void
    {
        if(!this.force)
        {
            // No force, no need to do the calculations
            return;
        }
        
        const d = (+new Date - this.lastTick) / 1000;

        this.lastTick = +new Date;

        const v = this.GetVelocity(d);

        const cell = this.world.GetCells().FindNearest(this.GetCenter())
        const nextPosition = this.GetPosition().Add(v);

        if(this.SetPosition(nextPosition))
        {
            this.force = this.force.F(n => n * cell.GetFriction());
        }
        else
        {
            this.force = this.force.F(n => n / Infinity);
        }
    }
}