import { BaseActor } from "../Actor/BaseActor";
import { MoveType } from "../MoveType";
import { Coord } from "../../Coord";
import { BaseElement } from "../BaseElement";

export abstract class BaseCell extends BaseElement
{
    protected actors: BaseActor[] = [];

    /**
     * Construct a new empty cell - ground.
     * @param position Coord of the cell.
     */
    public constructor(position: Coord = null)
    {
        super(position);
    }
    
    /**
     * Get the cell position.
     */
    public GetPos(): Coord 
    {
        return this.position;
    }

    /**
     * Enter a cell with a actor.
     * @param actor 
     */
    public MoveHere(actor: BaseActor): MoveType 
    {
        this.actors.push(actor);

        return MoveType.Successed;
    }

    /**
     * Leave cell.
     * @param actor 
     */
    public MoveAway(actor: BaseActor): void 
    {
        const index = this.actors.indexOf(actor);

        if(index >= 0) 
        {
            this.actors.splice(index, 1);
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

        if(this instanceof BaseCell)
        {
            this.map.GetCells().Remove(this);
        }
    }
    
    abstract GetSize(): Coord;
    abstract GetTexture(): string;
}