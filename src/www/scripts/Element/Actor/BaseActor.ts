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
     * Set the position of the actor.
     * @param position 
     */
    protected SetPos(nextPos: Coord = null, prevPos: Coord = null): boolean
    {
        // Get the currently covered cells and the next ones
        const prevCells = prevPos 
            ? this.map.GetCells().GetBetween(prevPos, prevPos.Add(this.GetSize()))
            : [];
        
        const nextCells = nextPos
            ? this.map.GetCells().GetBetween(nextPos, nextPos.Add(this.GetSize()))
            : [];
        
        if(!prevCells.length && !nextCells.length)
        {
            return false;
        }

        // Remove intersection 
        const prevFiltered = prevCells.filter(c => !nextCells.includes(c));
        const nextFiltered = nextCells.filter(c => !prevCells.includes(c));

        // Check if one of the cells blocks the movement
        const failed = nextFiltered.some(cell => 
        {
            return this.HandleMove(cell.MoveHere(this));
        });

        // If the movement failed, revert
        if(failed)
        {
            nextFiltered.forEach(c => c.MoveAway(this));
            return false;
        }

        // If it was successful, move away from the old cells
        prevFiltered.forEach(c => c.MoveAway(this));

        // Update position
        this.position = nextPos;

        // Notify upper parts
        this.map.OnUpdate(this);

        return true;
    }

    /**
     * Handle movement types.
     * @param type 
     */
    protected HandleMove(type: MoveType)
    {
        return type != MoveType.Successed;
    }

    /**
     * Override import all to handle position change.
     * @param input
     */
    public ImportAll(input: IExportObject[]): void
    {
        const oldPosition = this.position;

        super.ImportAll(input);

        if(!this.position.Is(oldPosition))
        {
            this.SetPos(this.position, oldPosition);
        }
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
        this.SetPos(null);

        if(this instanceof BaseActor)
        {
            this.map.GetActors().Remove(this);
        }
    }
    
    abstract GetPos(): Coord;
    abstract GetSize(): Coord;
    abstract GetTexture(): string;
}