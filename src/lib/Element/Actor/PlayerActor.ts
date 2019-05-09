import { Vector } from "../../Geometry/Vector";
import { ArrowActor } from "./ArrowActor";
import { LivingActor } from "./LivingActor";
import { Exportable, ExportType } from "../../Exportable";

const SHOT_DELAY = 800;

export class PlayerActor extends LivingActor
{
    @Exportable.Register(ExportType.All)
    protected lastShot = +new Date(0);

    /**
     * Shoot an arrow to the angle the player is facing.
     * @param id The id of the new arrow.
     */
    public Shoot(id: string): void
    {
        const now = +new Date;

        if(this.lastShot + SHOT_DELAY > now) 
        {
            throw new Error("Shot was too quick");
        }

        const r = this.GetRadius();
        const direction = Vector.AngleToVector(this.GetAngle());
        const position = this.GetCenter().Add(direction.Scale(new Vector(r, r)));

        const actor = new ArrowActor;

        actor.Init({
            id: id,
            position: position,
            size: new Vector(0.1, 0.1),
            texture: "res/stone.png",
            angle: this.GetAngle(),
            damage: this.damage,
            speed: 0.075,
            origin: this.origin,
            board: this.board
        });

        this.board.GetActors().Set(actor);
        this.lastShot = now;
    }
    
    /**
     * @inheritDoc
     */
    protected OnTick(): void
    {
        return;
    }
}

Exportable.Dependency(PlayerActor);