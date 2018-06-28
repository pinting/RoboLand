import { GroundCell } from "./GroundCell"
import { IActor } from "../Actor/IActor";
import { MoveType } from "../MoveType";
import { CellType } from "./CellType";

export class WaterCell extends GroundCell
{
    /**
     * Get the type of the cell.
     */
    public GetType(): CellType
    {
        return CellType.Water;
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
    public MoveHere(actor: IActor): MoveType 
    {
        return MoveType.Killed;
    }
}