import { ICell } from "./ICell"
import { IActor } from "../Actor/IActor";
import { Coord } from "../../Coord";
import { MoveType } from "../MoveType";
import { ElementType } from "../ElementType"

export class GroundCell implements ICell
{
    protected actors: IActor[] = [];
    protected position: Coord;

    /**
     * Construct a new empty cell - ground.
     * @param position Coord of the cell.
     */
    public constructor(position: Coord)
    {
        this.position = position;
    }

    /**
     * Get the type of the cell.
     */
    public GetType(): ElementType
    {
        return ElementType.GroundCell;
    }
    
    /**
     * Get the cell position.
     */
    public GetPos(): Coord 
    {
        return this.position;
    }

    /**
     * Get the size of the cell.
     */
    public GetSize(): Coord
    {
        return new Coord(1.0, 1.0);
    }

    /**
     * Get the texture of the cell.
     */
    public GetTexture(): string
    {
        return "res/ground.png";
    }

    /**
     * Enter a cell with a actor.
     * @param actor 
     */
    public MoveHere(actor: IActor): MoveType 
    {
        this.actors.push(actor);

        return MoveType.Successed;
    }

    /**
     * Leave cell.
     * @param actor 
     */
    public MoveAway(actor: IActor): void 
    {
        const index = this.actors.indexOf(actor);

        if(index >= 0) 
        {
            this.actors.splice(index, 1);
        }
    }
}