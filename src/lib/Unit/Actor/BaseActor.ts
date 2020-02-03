import { Vector } from "../../Geometry/Vector";
import { Unit, UnitArgs } from "../Unit";
import { Body } from "../../Physics/Body";

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
        
        this.blocking = typeof args.blocking === "boolean" ? args.blocking : true;
    }

    protected ValidateBody(scale: Vector, rotation: number, offset: Vector): boolean
    {
        if(!this.world)
        {
            return true;
        }

        const body = this.GetBody();
        const newBody = <Body>body.Clone();
        
        newBody.SetVirtual(scale, rotation, offset);

        // Get the currently covered cells and the next ones
        const prev = body.GetOffset()
            ? this.world.GetCells().GetArray().filter(c => c.GetBody().Collide(body))
            : [];
        
        const next = this.world.GetCells().GetArray().filter(c => c.GetBody().Collide(newBody));

        if(!next.length)
        {
            return false;
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

        this.world && this.world.GetActors().Remove(this);

        super.Dispose();
    }
}