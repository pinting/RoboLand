import { BaseActor } from "../Actor/BaseActor";
import { BaseCell } from "./BaseCell";

export class StoneCell extends BaseCell
{
    /**
     * @inheritDoc
     */
    public MoveHere(actor: BaseActor): boolean 
    {
        return false;
    }
}