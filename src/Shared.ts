import * as React from "react";
import "./Shared.css";
import { PlayerActor } from "./lib/Element/Actor/PlayerActor";
import { Vector } from "./lib/Geometry/Vector";
import { Keyboard } from "./lib/Util/Keyboard";
import { Tools } from "./lib/Util/Tools";
import { Exportable } from "./lib/Exportable";
import { Board } from "./lib/Board";
import { WaterCell } from "./lib/Element/Cell/WaterCell";
import { StoneCell } from "./lib/Element/Cell/StoneCell";
import { GroundCell } from "./lib/Element/Cell/GroundCell";
import { FireCell } from "./lib/Element/Cell/FireCell";
import { ArrowActor } from "./lib/Element/Actor/ArrowActor";

// Dependency classes as a dependency
Exportable.Dependency(ArrowActor);
Exportable.Dependency(PlayerActor);
Exportable.Dependency(FireCell);
Exportable.Dependency(GroundCell);
Exportable.Dependency(StoneCell);
Exportable.Dependency(WaterCell);
Exportable.Dependency(Board);
Exportable.Dependency(Vector);

const SHOT_DELAY = 1000;
const TURN_SPEED = Vector.DegToRad(2);

export abstract class Shared<P = {}, S = {}> extends React.PureComponent<P, S>
{
    protected nextShoot = +new Date(0);

    /**
     * The consturtor of the Shared element - which is abstract, so
     * cannot be constructed on its own.
     * @param props
     */
    constructor(props) 
    {
        super(props);
        Keyboard.Init();
    }

    /**
     * Game cycle
     * @param player 
     * @param data.up
     * @param data.left
     * @param data.down
     * @param data.right
     * @param data.space
     */
    protected OnDraw(player: PlayerActor, { up, left, down, right, space })
    {
        if(!player)
        {
            return;
        }

        if(Keyboard.Keys[left])
        {
            player.SetAngle(player.GetAngle() - TURN_SPEED);
        }

        if(Keyboard.Keys[right])
        {
            player.SetAngle(player.GetAngle() + TURN_SPEED);
        }

        if(Keyboard.Keys[up])
        {
            player.Move();
        }

        if(Keyboard.Keys[down])
        {
            player.Move(Vector.DegToRad(180));
        }

        if(Keyboard.Keys[space] && this.nextShoot <= +new Date)
        {
            player.Shoot(Tools.Unique());
            this.nextShoot = +new Date + SHOT_DELAY;
        }
    }
}