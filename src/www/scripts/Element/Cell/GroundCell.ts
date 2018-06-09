import { ICell } from "./ICell"
import { IRobot } from "../Robot/IRobot";
import { Coord } from "../../Coord";
import { MoveType } from "../MoveType";
import { CellType } from "./CellType"

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
     * Enter a cell with a robot.
     * @param robot 
     */
    public MoveHere(robot: IRobot): MoveType 
    {
        if(this.robot != null) 
        {
            return MoveType.Blocked;
        }

        this.robot = robot;

        return MoveType.Successed;
    }

    /**
     * Leave cell.
     */
    public MoveAway(): void 
    {
        this.robot = null;
    }
}