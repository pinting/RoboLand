import { GroundCell } from "./GroundCell"
import { IRobot } from "../Robot/IRobot";
import { MoveType } from "../MoveType";

export class WaterCell extends GroundCell
{
    /**
     * Get the cell texture.
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