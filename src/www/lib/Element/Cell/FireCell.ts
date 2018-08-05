import { BaseActor } from "../Actor/BaseActor";
import { BaseCell } from "./BaseCell";
import { LivingActor } from "../Actor/LivingActor";
import { BaseElementArgs } from "../BaseElement";

export interface FireCellArgs extends BaseElementArgs
{
    damage?: number;
}

export class FireCell extends BaseCell
{
    protected damage: number;

    /**
     * @inheritDoc
     */
    public constructor(args: FireCellArgs)
    {
        super(args);

        this.damage = args.damage;
    }

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
        this.actors.forEach(tag =>
        {
            const actor = this.map.Actors.Get(tag);

            if(actor instanceof LivingActor)
            {
                actor.Damage(this.damage);
            }
        });
    }
}