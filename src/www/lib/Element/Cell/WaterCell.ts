import { BaseActor } from "../Actor/BaseActor";
import { BaseCell } from "./BaseCell";
import { PlayerActor } from "../Actor/PlayerActor";

export class StoneCell extends BaseCell
{
    /**
     * @inheritDoc
     */
    public MoveHere(actor: BaseActor): boolean 
    {
        if(actor instanceof PlayerActor)
        {
            actor.Disposed = true;
        }
        
        return true;
    }
}