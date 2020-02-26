import { Vector } from "../../Geometry/Vector";
import { Unit, UnitArgs } from "../Unit";
import { Body } from "../../Physics/Body";

const COLLISION_LIMIT = 3;

export interface BaseActorArgs extends UnitArgs
{
    // Empty
}

export abstract class BaseActor extends Unit
{
    private noGround = 0;

    /**
     * @inheritDoc
     */
    protected InitPre(args: BaseActorArgs = {})
    {
        super.InitPre(args);
        
        this.blocking = args.blocking === undefined ? this.blocking || true : args.blocking;
    }

    /**
     * Validate a positional change of the body.
     * @param scale 
     * @param rotation 
     * @param position 
     */
    protected ValidateBody(scale: Vector, rotation: number, position: Vector): boolean
    {
        if(this.ignore || !this.world)
        {
            return true;
        }

        const body = this.GetBody();
        const newBody = body.Clone() as Body;
        
        newBody.SetVirtual(scale, rotation, position);

        // Get the currently covered cells and the next ones
        const prev = body.GetPosition()
            ? this.world.GetCells().GetArray().filter(c => c.GetBody().Collide(body))
            : [];
        
        const next = this.world.GetCells().GetArray().filter(c => c.GetBody().Collide(newBody));

        if(!next.length)
        {
            // This fixes a nasty bug in the physics engine.
            // For some reason, rotation causes invalid moves,
            // because the engine does not find collisions with
            // cells under the actor.
            // TODO: FIX THIS
            this.noGround++;

            if(this.noGround >= COLLISION_LIMIT)
            {
                return false;
            }
        }
        else
        {
            this.noGround = 0;
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

        if(!this.ignore && this.world)
        {
            this.world.GetActors().Remove(this);
        }

        super.Dispose();
    }
}