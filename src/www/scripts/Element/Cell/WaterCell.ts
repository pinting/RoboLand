import { GroundCell } from "./GroundCell"
import { BaseActor } from "../Actor/BaseActor";
import { MoveType } from "../MoveType";
import { Coord } from "../../Coord";
import { BaseCell } from "./BaseCell";

export class WaterCell extends BaseCell
{
    /**
     * Get the size of the cell.
     */
    public GetSize(): Coord
    {
        return new Coord(2.0, 1.0);
    }

    /**
     * Get the texture of the cell.
     */
    public GetTexture(): string
    {
        return "res/water.png";
    }

    /**
     * Enter a cell with a actor and kill it.
     * @param actor 
     */
    public MoveHere(actor: BaseActor): MoveType 
    {
        return MoveType.Killed;
    }
}