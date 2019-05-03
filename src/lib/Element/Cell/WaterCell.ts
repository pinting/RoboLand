import { BaseActor } from "../Actor/BaseActor";
import { BaseCell } from "./BaseCell";
import { LivingActor } from "../Actor/LivingActor";
import { Exportable } from "../../Exportable";
import { Mesh } from "../../Physics/Mesh";

export class WaterCell extends BaseCell
{
    /**
     * @inheritDoc
     */
    public MoveHere(actor: BaseActor, mesh: Mesh): boolean 
    {
        if(this.virtualMesh.Collide(mesh) && actor instanceof LivingActor)
        {
            actor.Dispose();
        }
        
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

Exportable.Dependency(WaterCell);