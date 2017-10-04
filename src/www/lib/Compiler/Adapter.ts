import { Map } from '../Map';
import { IRobot } from "../Element/Robot/IRobot";
import { Coord } from "../Coord";
import { CellType } from "../Element/Cell/CellType";

export class Adapter
{
    private robot: IRobot;
    private map: Map;

    constructor(robot: IRobot)
    {
        this.robot = robot;
        this.map = Map.GetInstance();
    }

    /**
     * Move to the given direction.
     * @param dx
     * @param dy
     */
    public move(dx: number, dy: number): boolean
    {
        return this.robot.Move(new Coord(dx, dy));
    }

    /**
     * Test if the given direction is safe
     * @param dx
     * @param dy 
     */
    public test(dx: number, dy: number): boolean
    {
        var cell = this.map.GetCell(this.robot.GetPosition().Difference(new Coord(dx, dy)));

        return cell != null && cell.GetType() == CellType.Ground;
    }

    /**
     * Try to attack someone around the player
     */
    public attack(): boolean
    {
        var result: IRobot = null;

        this.map.GetRobots().some(robot => 
        {
            if(robot.GetPosition().GetDistance(this.robot.GetPosition()) == 1) 
            {
                result = robot;

                return true;
            }

            return false;
        });

        return result != null && this.robot.Attack(result);
    }
}