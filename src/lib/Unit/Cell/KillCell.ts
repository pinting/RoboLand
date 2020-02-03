import { BaseActor } from "../Actor/BaseActor";
import { BaseCell } from "./BaseCell";
import { PlayerActor } from "../Actor/PlayerActor";
import { Exportable } from "../../Exportable";

export class KillCell extends BaseCell
{
    /**
     * @inheritDoc
     */
    public MoveHere(actor: BaseActor): void 
    {
        if(actor instanceof PlayerActor)
        {
            actor.Dispose();
        }
    }
}

Exportable.Dependency(KillCell);