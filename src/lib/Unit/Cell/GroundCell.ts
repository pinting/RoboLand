import { BaseActor } from "../Actor/BaseActor";
import { BaseCell } from "./BaseCell";
import { Exportable } from "../../Exportable";

export class GroundCell extends BaseCell
{
    /**
     * @inheritDoc
     */
    public MoveHere(actor: BaseActor): boolean 
    {
        return true;
    }
}

Exportable.Dependency(GroundCell);