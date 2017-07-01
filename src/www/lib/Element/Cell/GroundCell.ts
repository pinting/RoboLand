import { ICell } from "./ICell"
import { IRobot } from "../Robot/IRobot";
import { Coord } from "../../Coord";
import { Movement } from "../Movement";

export class GroundCell implements ICell
{
    protected position: Coord;
    protected robot: IRobot;

    /**
     * Construct a new empty cell - ground.
     * @param position Coord of the cell.
     */
    public constructor(position: Coord)
    {
        this.position = position;
    }

    /**
     * Get the cell texture.
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
     * Enter a cell with a robot.
     * @param robot 
     */
    public MoveHere(robot: IRobot): Movement 
    {
        if(this.robot == null) 
        {
            return Movement.Blocked;
        }

        this.robot = robot;

        return Movement.Successed;
    }

    /**
     * Leave cell.
     */
    public MoveAway(): void 
    {
        this.robot = null;
    }
}