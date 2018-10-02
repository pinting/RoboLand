import { BaseActor } from "../Actor/BaseActor";
import { BaseCell } from "./BaseCell";
import { Exportable } from "../../Exportable";

export class StoneCell extends BaseCell
{
    /**
     * @inheritDoc
     */
    public MoveHere(actor: BaseActor): boolean 
    {
        return false;
    }
    
    /**
     * @inheritDoc
     */
    protected OnTick(): void
    {
        return;
    }
}

Exportable.Register(StoneCell);