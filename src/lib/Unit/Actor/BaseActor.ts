import { Vector } from "../../Geometry/Vector";
import { Unit, UnitArgs } from "../Unit";
import { Body } from "../../Physics/Body";

export interface BaseActorArgs extends UnitArgs
{
    // Empty
}

export abstract class BaseActor extends Unit
{
    public static DisableSurfaceScan = false;

    /**
     * The last body state that was checked against cells.
     */
    private lastBody: Body;

    /**
     * @inheritDoc
     */
    protected InitPre(args: BaseActorArgs = {})
    {
        super.InitPre(args);
        
        this.blocking = args.blocking === undefined ? this.blocking || true : args.blocking;
    }

    /**
     * Search for cells the actor is standing on.
     * @param scale 
     * @param rotation 
     * @param position 
     */
    protected OnBodyChange(scale: Vector, rotation: number, position: Vector): void
    {
        // Call super, trigger a World update
        super.OnBodyChange(scale, rotation, position);

        if(BaseActor.DisableSurfaceScan)
        {
            return;
        }

        // If no world under the cell, skip the rest
        if(this.ignore || !this.world)
        {
            return;
        }

        const body = this.GetBody();
        const newBody = body.Clone() as Body;
        
        newBody.SetVirtual(scale, rotation, position);

        // Do not check for new cells upon every body change,
        // because SAT is performance hungry
        if(this.lastBody && Body.Equal(this.lastBody, newBody))
        {
            return;
        }

        this.lastBody = newBody;

        // Get the currently covered cells and the next ones
        const prev = body.GetPosition()
            ? this.world.GetCells().GetArray().filter(c => c.GetBody().Collide(body))
            : [];
        
        const next = this.world.GetCells().GetArray().filter(c => c.GetBody().Collide(newBody));

        // Remove intersection 
        const prevFiltered = prev.filter(v => !next.includes(v));
        const nextFiltered = next.filter(v => !prev.includes(v));

        // Finalize
        nextFiltered.forEach(cell => cell.MoveHere(this))
        prevFiltered.forEach(cell => cell.MoveAway(this));
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