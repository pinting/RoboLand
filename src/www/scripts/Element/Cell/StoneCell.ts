import { GroundCell } from "./GroundCell"
import { IActor } from "../Actor/IActor";
import { MoveType } from "../MoveType";
import { ElementType } from "../ElementType";

export class StoneCell extends GroundCell
{
    /**
     * Get the type of the cell.
     */
    public GetType(): ElementType
    {
        return ElementType.StoneCell;
    }

    /**
     * Get the texture of the cell.
     */
    public GetTexture(): string
    {
        return "res/stone.png";
    }

    /**
     * Enter a cell with a actor and kill it.
     * @param actor 
     */
    public MoveHere(actor: IActor): MoveType 
    {
        return MoveType.Blocked;
    }
}