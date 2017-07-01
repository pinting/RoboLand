import { GroundCell } from "./GroundCell"
import { IRobot } from "../Robot/IRobot";
import { Movement } from "../Movement";

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
    public MoveHere(robot: IRobot): Movement 
    {
        return Movement.Killed;
    }
}