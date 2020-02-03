import { BaseActor, BaseActorArgs } from "./BaseActor";
import { Exportable, ExportType } from "../../Exportable";
import { PlayerActor } from "./PlayerActor";
import { Vector } from "../../Geometry/Vector";

export interface ArrowActorArgs extends BaseActorArgs
{
    damage?: number;
}

export class ArrowActor extends BaseActor
{
    @Exportable.Register(ExportType.Visible)
    protected damage: number;

    /**
     * @inheritDoc
     */
    public Init(args: ArrowActorArgs = {})
    {
        super.Init(args);
    }

    /**
     * @inheritDoc
     */
    protected InitPre(args: ArrowActorArgs = {})
    {
        super.InitPre(args);
        
        this.damage = args.damage;
    }

    /**
     * @inheritDoc
     */
    protected InitPost(args: ArrowActorArgs = {})
    {
        super.InitPost(args);
    }

    /**
     * @inheritDoc
     */
    protected OnTick(dt: number): void
    {
        super.OnTick(dt);

        // If arrow stops moving, dispose it
        if(this.GetBody().GetVelocity().Equal(new Vector) && this.GetBody().GetForce().Equal(new Vector))
        {
            this.Dispose();
            return;
        }
        
        const result = this.world.GetUnits().FindCollisions(this);

        for(const actor of result)
        {
            // Damage every touched player
            if(actor instanceof PlayerActor)
            {
                actor.Damage(this.damage);
            }
        }

        // If the arrow hit anything, dispose it
        if(result.length)
        {
            this.Dispose();
        }
    }
}

Exportable.Dependency(ArrowActor);