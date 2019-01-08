import * as React from "react";
import "./Shared.css";
import { PlayerActor } from "./lib/Element/Actor/PlayerActor";
import { Coord } from "./lib/Coord";
import { Keyboard } from "./lib/Tools/Keyboard";
import { Utils } from "./lib/Tools/Utils";
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
Exportable.Dependency(Coord);

const SHOT_DELAY = 1000;

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

        const direction = new Coord(
            Keyboard.Keys[left] ? -1 : Keyboard.Keys[right] ? 1 : 0, 
            Keyboard.Keys[up] ? -1 : Keyboard.Keys[down] ? 1 : 0
        );

        if(direction.GetDistance(new Coord) == 1)
        {
            player.Move(direction);
        }

        if(Keyboard.Keys[space] && this.nextShoot <= +new Date)
        {
            player.Shoot(Utils.Unique());
            this.nextShoot = +new Date + SHOT_DELAY;
        }
    }
}