import { BaseActor } from "./BaseActor";
import { Exportable, ExportType } from "../../Exportable";
import { UnitArgs } from "../Unit";

export interface ArrowActorArgs extends UnitArgs
{
    damage?: number;
    speed?: number;
}

export class ArrowActor extends BaseActor
{
    @Exportable.Register(ExportType.Visible)
    protected damage: number;

    @Exportable.Register(ExportType.Visible)
    protected speed: number;

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

        this.angle = args.angle;
        this.damage = args.damage;
        this.speed = args.speed;
    }

    /**
     * @inheritDoc
     */
    protected OnTick(): void
    {
        /*
        super.OnTick();
        
        const facing = Vector.AngleToVector(this.GetAngle());
        const success = this.SetPosition(this.GetPosition().Add(facing.Scale(this.speed)));

        // If the arrow hit a wall, dispose it
        if(!success)
        {
            this.Dispose();
            return;
        }

        const result = this.world.GetActors().FindCollisions(this);

        let hit = false;

        // Damage every touched living actor
        for(const actor of result)
        {
            if(actor instanceof LivingActor)
            {
                actor.Damage(this.damage);
                hit = true;
            }
        }

        // If the arrow hit a living thing, dispose it
        if(hit)
        {
            this.Dispose();
        }
        */
    }
}

Exportable.Dependency(ArrowActor);