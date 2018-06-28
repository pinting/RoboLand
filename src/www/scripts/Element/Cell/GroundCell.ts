import { ICell } from "./ICell"
import { IActor } from "../Actor/IActor";
import { Coord } from "../../Coord";
import { MoveType } from "../MoveType";
import { CellType } from "./CellType"

export class GroundCell implements ICell
{
    protected position: Coord;
    protected actor: IActor;

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
    public GetType(): CellType
    {
        return CellType.Ground;
    }

    /**
     * Get the texture of the cell.
     */
    public GetTexture(): string
    {
        return "res/ground.png";
    }
    
    /**
     * Get the cell position.
     */
    public GetPosition(): Coord 
    {
        return this.position;
    }

    /**
     * Enter a cell with a actor.
     * @param actor 
     */
    public MoveHere(actor: IActor): MoveType 
    {
        if(this.actor != null) 
        {
            return MoveType.Blocked;
        }

        this.actor = actor;

        return MoveType.Successed;
    }

    /**
     * Leave cell.
     */
    public MoveAway(): void 
    {
        this.actor = null;
    }
}