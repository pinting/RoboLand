import { Map } from '../Map';
import { Coord } from "../Coord";
import { ElementType } from "../Element/ElementType";
import { PlayerActor } from '../Element/Actor/PlayerActor';

export class Adapter
{
    private readonly map: Map = Map.GetInstance();
    private actor: PlayerActor;

    constructor(actor: PlayerActor)
    {
        this.actor = actor;
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
        const coord = this.actor.GetPos().Add(new Coord(dx, dy));
        const cell = this.map.GetCells().Get(coord)[0];

        return cell && cell.GetType() == ElementType.GroundCell ? 1 : 0;
    }

    /**
     * Try to attack someone around the player.
     */
    public attack(): number
    {
        let result: PlayerActor = null;

        this.map.GetActors().ForEach(actor => 
        {
            const distance = actor.GetPos().GetDistance(this.actor.GetPos());

            if(actor instanceof PlayerActor && distance <= 1.0) 
            {
                result = actor;

                return true;
            }

            return false;
        });

        return result != null && this.actor.Attack(result) ? 1 : 0;
    }
}