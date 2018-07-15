import { BaseActor } from "../Actor/BaseActor";
import { MoveType } from "../MoveType";
import { ElementType } from "../ElementType";
import { Coord } from "../../Coord";
import { BaseCell } from "./BaseCell";

export class StoneCell extends BaseCell
{
    /**
     * Get the type of the cell.
     */
    public GetType(): ElementType
    {
        return ElementType.StoneCell;
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
        return "res/stone.png";
    }

    /**
     * Enter a cell with a actor and block it.
     * @param actor 
     */
    public MoveHere(actor: BaseActor): MoveType 
    {
        return MoveType.Blocked;
    }
}