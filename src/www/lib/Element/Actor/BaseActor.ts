import { Coord } from "../../Coord";
import { BaseElement } from "../BaseElement";
import { Map } from "../../Map";

export abstract class BaseActor extends BaseElement
{
    /**
     * @inheritDoc
     */
    public set Position(position: Coord)
    {
        const prevPos = this.Position;
        const nextPos = position;

        // Get the currently covered cells and the next ones
        const prev = prevPos 
            ? this.map.Cells.FindBetween(prevPos, prevPos.Add(this.size))
            : [];
        
        const next = nextPos
            ? this.map.Cells.FindBetween(nextPos, nextPos.Add(this.size))
            : [];

        // If prevPos/nextPos was given, but no cells found, return
        if((prevPos && !prev.length) || (nextPos && !next.length))
        {
            return;
        }

        // Remove intersection 
        const prevFiltered = prev.filter(c => !next.includes(c));
        const nextFiltered = next.filter(c => !prev.includes(c));

        // Check if one of the cells blocks the movement
        if(nextFiltered.some(cell => !cell.MoveHere(this)))
        {
            // If yes, revert all movement and return
            nextFiltered.forEach(c => c.MoveAway(this));
            return;
        }

        // If it was successful, move away from the old cells
        prevFiltered.forEach(c => c.MoveAway(this));

        // Call super
        super.Position = nextPos;

        // Notify map
        this.map.OnUpdate.Call(this);
    }

    /**
     * @inheritDoc
     */
    public get Position(): Coord
    {
        // We need to override the getter too, if we
        // want to override the setter
        return super.Position;
    }

    /**
     * @inheritDoc
     */
    public set Disposed(value: boolean)
    {
        if(this.disposed || !value)
        {
            return;
        }

        super.Disposed = true;
        this.Position = null; // Remove actor from cells

        if(this instanceof BaseActor)
        {
            this.map.Actors.Remove(this);
        }
    }

    /**
     * @inheritDoc
     */
    public get Disposed(): boolean
    {
        // Needed because JavaScript limitation
        return super.Disposed;
    }

    /**
     * @inheritDoc
     */
    protected OnTick(): void
    {
        return;
    }
}