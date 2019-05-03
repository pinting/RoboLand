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
    public SetPosition(position: Vector): boolean
    {
        return this.WillCollide(position, this.angle) && super.SetPosition(position);
    }

    /**
     * @inheritDoc
     */
    public SetAngle(angle: number): boolean
    {
        return this.WillCollide(this.position, angle) && super.SetAngle(angle);
    }

    /**
     * Check if the given position and angle will cause collision.
     * @param position 
     * @param angle 
     */
    private WillCollide(position: Vector, angle: number): boolean
    {
        const prevPos = this.GetPosition();
        const nextPos = position;

        const prevMesh = this.virtualMesh
        const nextMesh = this.mesh.F(v => v
            .Rotate(angle, this.size.F(s => s / 2))
            .Add(nextPos));

        // Get the currently covered cells and the next ones
        const prev = prevPos 
            ? this.board.GetCells().FindAround(prevMesh)
            : [];
        
            const next = nextPos
            ? this.board.GetCells().FindAround(nextMesh)
            : [];

        // If prevPos/nextPos was given, but no cells found, return
        if((prevPos && !prev.length) || (nextPos && !next.length))
        {
            return false;
        }

        // Remove intersection 
        const prevFiltered = prev.filter(v => !next.includes(v));
        const nextFiltered = next.filter(v => !prev.includes(v));

        // Check if one of the cells blocks the movement
        if(nextFiltered.some(cell => !cell.MoveHere(this, nextMesh)))
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