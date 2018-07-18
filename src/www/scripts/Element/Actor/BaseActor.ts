import { Coord } from "../../Coord";
import { BaseElement } from "../BaseElement";
import { IExportObject } from "../../IExportObject";
import { MoveType } from "../MoveType";

export abstract class BaseActor extends BaseElement
{
    /**
     * Construct a new PlayerActor.
     * @param position
     */
    public constructor(position: Coord = null)
    {
        super(position);
        this.SetPos(this.position);
    }
    
    /**
     * Get the position of the actor.
     */
    public GetPos(): Coord
    {
        return this.position;
    }

    /**
     * Set the position of the actor.
     * @param position 
     */
    protected SetPos(nextPos: Coord = null, prevPos: Coord = null): boolean
    {
        const cells = this.map.GetCells();

        // Get the currently covered cells and the next ones
        const prev = prevPos 
            ? cells.GetBetween(prevPos, prevPos.Add(this.GetSize()))
            : [];
        
        const next = nextPos
            ? cells.GetBetween(nextPos, nextPos.Add(this.GetSize()))
            : [];

        // Remove intersection 
        const prevFiltered = prev.filter(c => !next.includes(c));
        const nextFiltered = next.filter(c => !prev.includes(c));

        // Check if one of the cells blocks the movement
        const failed = nextFiltered.some(cell => 
            !this.HandleMove(cell.MoveHere(this)));

        // If the movement failed, revert
        if(failed)
        {
            nextFiltered.forEach(c => c.MoveAway(this));
            return false;
        }

        // If it was successful, move away from the old cells
        prevFiltered.forEach(c => c.MoveAway(this));

        // Update
        this.position = nextPos;
        this.map.OnUpdate(this);

        return true;
    }

    /**
     * Dispose the cell.
     */
    public Dispose(): void
    {
        if(this.disposed)
        {
            return;
        }
        
        super.Dispose();
        this.SetPos();

        if(this instanceof BaseActor)
        {
            this.map.GetActors().Remove(this);
        }
    }

    protected abstract HandleMove(type: MoveType): boolean;
    public abstract GetSize(): Coord;
    public abstract GetTexture(): string;
}