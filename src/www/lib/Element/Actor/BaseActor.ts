import { Coord } from "../../Coord";
import { BaseElement, BaseElementArgs } from "../BaseElement";

export interface BaseActorArgs extends BaseElementArgs
{
    direction?: Coord;
}

export abstract class BaseActor extends BaseElement
{
    protected direction: Coord;

    /**
     * @inheritDoc
     */
    public constructor(args: BaseActorArgs = {})
    {
        super(args);

        this.direction = this.direction;
    }
    
    /**
     * @inheritDoc
     */
    protected SetPos(position: Coord): boolean
    {
        const prevPos = this.Position;
        const nextPos = position;

        // Check if it goes out of the map
        if(nextPos && (!nextPos.Inside(new Coord(0, 0), this.map.Size) || 
            !nextPos.Add(this.Size).Inside(new Coord(0, 0), this.map.Size)))
        {
            return false;
        }

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
            return false;
        }

        // Remove intersection 
        const prevFiltered = prev.filter(c => !next.includes(c));
        const nextFiltered = next.filter(c => !prev.includes(c));

        // Check if one of the cells blocks the movement
        if(nextFiltered.some(cell => !cell.MoveHere(this)))
        {
            // If yes, revert all movement and return
            nextFiltered.forEach(c => c.MoveAway(this));
            return false;
        }

        // If it was successful, move away from the old cells
        prevFiltered.forEach(c => c.MoveAway(this));

        // Call super
        return super.SetPos(nextPos);
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

        this.SetPos(null); // Remove actor from cells

        if(this instanceof BaseActor)
        {
            this.map.Actors.Remove(this);
        }

        super.Dispose();
    }

    /**
     * Get the direction of the actor.
     */
    public get Direction(): Coord
    {
        return this.direction && this.direction.Clone();
    }
}