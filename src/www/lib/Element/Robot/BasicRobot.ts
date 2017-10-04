import { IRobot } from "./IRobot";
import { Coord } from "../../Coord";
import { Map } from "../../Map";
import { MoveType } from "../MoveType";

export class BasicRobot implements IRobot
{
    protected health: number = 1.0;
    protected damage: number = 0.1;

    private position: Coord;

    /**
     * Construct a new BasicRobot.
     * @param position
     */
    public constructor(position: Coord)
    {
        this.position = position;

        var cell = Map.GetInstance().GetCell(position);

        if(cell != null)
        {
            cell.MoveHere(this);
        }
    }

    /**
     * Get the cell texture.
     */
    public GetTexture(): string
    {
        return "res/robot.png";
    }

    /**
     * Move robot in a direction.
     * @param direction
     */
    public Move(direction: Coord): boolean
    {
        if(Math.abs(Math.abs(direction.X) - Math.abs(direction.Y)) == 0)
        {
            return false; // Only allow left, right, top and bottom movement
        }

        const map = Map.GetInstance();

        var lastCell = map.GetCell(this.position);
        var nextCoord = this.position.Difference(direction);
        var nextCell = map.GetCell(nextCoord);

        if(lastCell == null || nextCell == null)
        {
            return false;
        }

        switch(nextCell.MoveHere(this))
        {
            case MoveType.Blocked: // Do nothing
                return false;
            case MoveType.Killed: // Move away and kill it
                lastCell.MoveAway();
                map.RemoveRobot(this);
                map.OnUpdate();
                return false;
            case MoveType.Successed: // Move away
                lastCell.MoveAway();
                map.OnUpdate();
                break;
        }

        this.position = nextCoord;

        return true;
    }

    /**
     * Attack an other robot if it is one cell away.
     * @param robot 
     */
    public Attack(robot: IRobot): boolean
    {
        if(this.position.GetDistance(robot.GetPosition()) > 1)
        {
            return false;
        }

        robot.Damage(this.damage);
    }

    /**
     * Get the position of the robot.
     */
    public GetPosition(): Coord 
    {
        return this.position;
    }

    /**
     * Do damage to this robot.
     * @param damage Amount of the damage.
     */
    public Damage(damage: number): void
    {
        this.health -= damage;
    }
}