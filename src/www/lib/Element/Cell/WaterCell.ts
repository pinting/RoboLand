import { GroundCell } from "./GroundCell"
import { IRobot } from "../Robot/IRobot";
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
     * Enter a cell with a robot and kill it.
     * @param robot 
     */
    public MoveHere(robot: IRobot): MoveType 
    {
        return MoveType.Killed;
    }
}