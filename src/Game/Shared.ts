import { PlayerActor } from "../lib/Unit/Actor/PlayerActor";
import { Keyboard } from "../lib/Util/Keyboard";
import { Tools } from "../lib/Util/Tools";

export class Shared
{

    /**
     * Should be used inside the main loop
     * @param player 
     * @param data.up
     * @param data.left
     * @param data.down
     * @param data.right
     * @param data.shoot
     */
    public static DoControl(player: PlayerActor, { up, left, down, right, shoot })
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