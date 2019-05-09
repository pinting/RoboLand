import { BaseActor } from "../Actor/BaseActor";
import { BaseCell } from "./BaseCell";
import { Exportable } from "../../Exportable";
import { Mesh } from "../../Geometry/Mesh";

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

Exportable.Dependency(GroundCell);