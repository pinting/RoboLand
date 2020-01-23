import { BaseActor } from "../Actor/BaseActor";
import { BaseCell, BaseCellArgs } from "./BaseCell";
import { Exportable } from "../../Exportable";

export class StoneCell extends BaseCell
{
    /**
     * @inheritDoc
     */
    protected InitPre(args: BaseCellArgs = {})
    {
        super.InitPre(args);
        
        this.blocking = args.blocking || true;
    }
}

Exportable.Dependency(StoneCell);