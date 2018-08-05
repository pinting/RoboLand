import { BaseActor } from "../Actor/BaseActor";
import { BaseCell } from "./BaseCell";
import { LivingActor } from "../Actor/LivingActor";

export class StoneCell extends BaseCell
{
    /**
     * @inheritDoc
     */
    public MoveHere(actor: BaseActor): boolean 
    {
        if(actor instanceof LivingActor)
        {
            actor.Dispose();
        }
        
        return true;
    }
    
    /**
     * @inheritDoc
     */
    protected OnTick(): void
    {
        return;
    }
}