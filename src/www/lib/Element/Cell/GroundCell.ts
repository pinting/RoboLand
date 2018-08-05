import { BaseActor } from "../Actor/BaseActor";
import { BaseCell } from "./BaseCell";

export class GroundCell extends BaseCell
{
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
        return;
    }
}