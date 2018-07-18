import { Map } from '../Map';
import { Coord } from "../Coord";
import { PlayerActor } from '../Element/Actor/PlayerActor';
import { GroundCell } from '../Element/Cell/GroundCell';

export class Adapter
{
    private readonly map: Map;
    private readonly actor: PlayerActor;

    constructor(actor: PlayerActor, map: Map = null)
    {
        this.map = map || Map.GetInstance();
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

        return cell && cell instanceof GroundCell ? 1 : 0;
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