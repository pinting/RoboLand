import { BaseCell, BaseCellArgs } from "./BaseCell";
import { Exportable } from "../../Exportable";

export class LightCell extends BaseCell
{
    /**
     * @inheritDoc
     */
    protected InitPre(args: BaseCellArgs = {})
    {
        super.InitPre(args);
        
        this.light = args.light || 6;
    }
}

Exportable.Dependency(LightCell);