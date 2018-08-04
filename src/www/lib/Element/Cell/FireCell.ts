import { BaseActor } from "../Actor/BaseActor";
import { BaseCell } from "./BaseCell";
import { PlayerActor } from "../Actor/PlayerActor";

export class FireCell extends BaseCell
{
    protected readonly damage: number = 0.1;

    /**
     * @inheritDoc
     */
    public MoveHere(actor: BaseActor): boolean 
    {   
        return true;
    }

    /**
     * @inheritDoc
     */
    protected OnTick(): void
    {
        this.actors.forEach(tag =>
        {
            const actor = this.map.Actors.Get(tag);

            if(actor instanceof PlayerActor)
            {
                actor.Damage(this.damage);
            }
        });
    }
}