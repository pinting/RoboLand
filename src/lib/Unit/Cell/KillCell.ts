import { BaseActor } from "../Actor/BaseActor";
import { BaseCell } from "./BaseCell";
import { PlayerActor } from "../Actor/PlayerActor";
import { Exportable } from "../../Exportable";

/**
 * When player touches it, it gets killed.
 */
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