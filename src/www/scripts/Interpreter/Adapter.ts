import { Map } from '../Map';
import { IActor } from "../Element/Actor/IActor";
import { Coord } from "../Coord";
import { ElementType } from "../Element/ElementType";

export class Adapter
{
    private actor: IActor;
    private map: Map;

    constructor(actor: IActor)
    {
        this.actor = actor;
        this.map = Map.GetInstance();
    }

    /**
     * Invert the given number.
     * @param n 
     */
    public inv(n: number): number
    {
        return n == 0 ? 1 : 0;
    }

    /**
     * Move to the given direction.
     * @param dx
     * @param dy
     */
    public move(dx: number, dy: number): number
    {
        return this.actor.Move(new Coord(dx, dy)) ? 1 : 0;
    }

    /**
     * Test if the given direction is safe.
     * @param dx
     * @param dy 
     */
    public test(dx: number, dy: number): number
    {
        let cell = this.map.GetCell(this.actor.GetPos().Add(new Coord(dx, dy)));

        return cell != null && cell.GetType() == ElementType.GroundCell ? 1 : 0;
    }

    /**
     * Try to attack someone around the player.
     */
    public attack(): number
    {
        let result: IActor = null;

        this.map.GetActors().some(actor => 
        {
            if(actor.GetPos().GetDistance(this.actor.GetPos()) == 1) 
            {
                result = actor;

                return true;
            }

            return false;
        });

        return result != null && this.actor.Attack(result) ? 1 : 0;
    }
}