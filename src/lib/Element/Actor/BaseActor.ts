import { Vector } from "../../Physics/Vector";
import { BaseElementArgs } from "../BaseElement";
import { TickElement } from "../TickElement";

export abstract class BaseActor extends TickElement
{
    /**
     * @inheritDoc
     */
    public Init(args: BaseElementArgs = {})
    {
        super.Init(args);
    }

    /**
     * @inheritDoc
     */
    protected InitPre(args: BaseElementArgs = {})
    {
        super.InitPre(args);

        this.angle = this.angle;
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
        if(!this.board)
        {
            return true;
        }

        const clone = <BaseActor>this.Clone();

        clone.SetAngle(angle);
        clone.SetPosition(position);

        const actors = this.board.GetActors().FindCollisions(clone);

        if(actors.length)
        {
            return false;
        }

        // Get the currently covered cells and the next ones
        const prev = this.position 
            ? this.board.GetCells().FindCollisions(this)
            : [];
        
        const next = this.board.GetCells().FindCollisions(clone);

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

        this.board.GetActors().Remove(this);
        super.Dispose();
    }
}