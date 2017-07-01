import { IRobot } from "./IRobot";
import { Coord } from "../../Coord";
import { Map } from "../../Map";
import { Movement } from "../Movement";

export class Robot implements IRobot
{
    protected health: number = 1.0;
    protected damage: number = 0.1;

    private position: Coord;
    private killed: boolean = false;

    protected map: Map = Map.GetInstance();

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
        var next = this.position.Difference(direction);
        var cell = this.map.GetCell(next);

        switch(cell.MoveHere(this))
        {
            case Movement.Blocked:
                return false; // Do nothing
            case Movement.Killed:
                this.map.RemoveRobot(this);
                this.map.OnUpdate();
                return false;
            case Movement.Successed:
                this.position = next;
                this.map.OnUpdate();
                return true;
        }
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