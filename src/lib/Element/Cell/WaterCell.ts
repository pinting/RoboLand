import { BaseActor } from "../Actor/BaseActor";
import { BaseCell } from "./BaseCell";
import { LivingActor } from "../Actor/LivingActor";
import { Exportable } from "../../Exportable";

export class WaterCell extends BaseCell
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
}

Exportable.Dependency(WaterCell);