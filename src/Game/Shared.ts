import { PlayerActor } from "../lib/Unit/Actor/PlayerActor";
import { Vector } from "../lib/Geometry/Vector";
import { Keyboard } from "../lib/Util/Keyboard";
import { Tools } from "../lib/Util/Tools";
import { Exportable } from "../lib/Exportable";
import { World } from "../lib/World";
import { KillCell } from "../lib/Unit/Cell/KillCell";
import { NormalCell } from "../lib/Unit/Cell/NormalCell";
import { DamageCell } from "../lib/Unit/Cell/DamageCell";
import { ArrowActor } from "../lib/Unit/Actor/ArrowActor";
import { Polygon } from "../lib/Geometry/Polygon";
import { Body } from "../lib/Physics/Body";
import { Matrix } from "../lib/Geometry/Matrix";

export class Shared
{
    /**
     * Import the inner modules of the engine.
     */
    public static RegisterDependencies()
    {
        Exportable.Dependency(ArrowActor);
        Exportable.Dependency(PlayerActor);
        Exportable.Dependency(DamageCell);
        Exportable.Dependency(NormalCell);
        Exportable.Dependency(KillCell);
        Exportable.Dependency(World);
        Exportable.Dependency(Vector);
        Exportable.Dependency(Matrix);
        Exportable.Dependency(Polygon);
        Exportable.Dependency(Body);
    }

    /**
     * Should be used inside the main loop
     * @param player 
     * @param data.up
     * @param data.left
     * @param data.down
     * @param data.right
     * @param data.shoot
     */
    public static SetupControl(player: PlayerActor, { up, left, down, right, shoot })
    {
        if(!player)
        {
            return;
        }

        if(Keyboard.Keys[left])
        {
            if(!player.IsRotating())
            {
                player.StartRot(true);
            }
        }
        else if(!Keyboard.Keys[right] && player.IsRotating())
        {
            player.StopRot();
        }

        if(Keyboard.Keys[right])
        {
            if(!player.IsRotating())
            {
                player.StartRot(false);
            }
        }
        else if(!Keyboard.Keys[left] && player.IsRotating())
        {
            player.StopRot();
        }

        if(Keyboard.Keys[up])
        {
            if(!player.IsWalking())
            {
                player.StartWalk(false);
            }
        }
        else if(!Keyboard.Keys[down] && player.IsWalking())
        {
            player.StopWalk();
        }

        if(Keyboard.Keys[down])
        {
            if(!player.IsWalking())
            {
                player.StartWalk(true);
            }
        }
        else if(!Keyboard.Keys[up] && player.IsWalking())
        {
            player.StopWalk();
        }

        if(Keyboard.Keys[shoot])
        {
            player.Shoot(Tools.Unique());
        }
    }
}