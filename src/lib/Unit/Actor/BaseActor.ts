import { Vector } from "../../Geometry/Vector";
import { Unit, UnitArgs } from "../Unit";
import { CollisionError } from "../../Physics/CollisionError";
import { BaseCellArgs } from "../Cell/BaseCell";

export interface BaseActorArgs extends UnitArgs
{
    // Empty
}

export abstract class BaseActor extends Unit
{
    /**
     * @inheritDoc
     */
    protected InitPre(args: BaseActorArgs = {})
    {
        super.InitPre(args);
        
        this.blocking = args.blocking || true;
    }
    
    /**
     * @inheritDoc
     */
    public SetSize(size?: Vector): boolean
    {
        return size &&
            this.Move(this.size, size, this.angle) && 
            super.SetSize(size);
    }
    
    /**
     * @inheritDoc
     */
    public SetPosition(position?: Vector): boolean
    {
        return position &&
            this.Move(this.size, position, this.angle) && 
            super.SetPosition(position);
    }

    /**
     * @inheritDoc
     */
    public SetAngle(angle?: number): boolean
    {
        return typeof angle === "number" && 
            this.Move(this.size, this.position, angle) && 
            super.SetAngle(angle);
    }
    
    protected Move(size: Vector, position: Vector, angle: number): boolean
    {
        // For clones, because they do not have a world
        if(!this.world || !this.size || !this.angle || !this.position)
        {
            return true;
        }

        const clone = <BaseActor>this.Clone();

        clone.SetSize(size);
        clone.SetAngle(angle);
        clone.SetPosition(position);

        const actors = this.world.GetActors().FindCollisions(clone);

        if(actors.length)
        {
            throw new CollisionError(actors.map(actor => actor.GetBody()));
        }

        // Get the currently covered cells and the next ones
        const prev = this.position 
            ? this.world.GetCells().FindCollisions(this)
            : [];
        
        const next = this.world.GetCells().FindCollisions(clone);

        if(!next.length)
        {
            // Position is taken by a cell
            throw new CollisionError([]);
        }

        // Remove intersection 
        const prevFiltered = prev.filter(v => !next.includes(v));
        const nextFiltered = next.filter(v => !prev.includes(v));

        nextFiltered.forEach(cell => cell.MoveHere(this))
        prevFiltered.forEach(cell => cell.MoveAway(this));

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
}