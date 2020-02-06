import * as React from "react";
import * as Bootstrap from "reactstrap";
import Cristal from "react-cristal";

import { Logger, LogType } from "../lib/Util/Logger";
import { Shared } from "../Game/Shared";
import { PlayerActor } from "../lib/Unit/Actor/PlayerActor";
import { ArrowActor } from "../lib/Unit/Actor/ArrowActor";
import { Body } from "../lib/Physics/Body";
import { Vector } from "../lib/Geometry/Vector";
import { Polygon } from "../lib/Geometry/Polygon";
import { Matrix } from "../lib/Geometry/Matrix";
import { Renderer } from "../lib/Renderer";
import { World } from "../lib/World";
import { Tools } from "../lib/Util/Tools";
import { ResourceManager } from "../lib/Util/ResourceManager";
import { SimplexNoise } from "../lib/Util/SimplexNoise";
import { Http } from "../lib/Util/Http";
import { Exportable } from "../lib/Exportable";
import { Keyboard } from "../lib/Util/Keyboard";
import { NormalCell } from "../lib/Unit/Cell/NormalCell";
import { IDump } from "../lib/IDump";

interface ViewProps {
    onClose: () => void;
    world?: IDump;
}

interface ViewState {

}

export class OnePlayerView extends React.PureComponent<ViewProps, ViewState>
{
    private canvas: HTMLCanvasElement;
    
    public async init(): Promise<void>
    {
        Logger.Type = LogType.Warn;
        Keyboard.Init();

        // Load or create the world
        let world: World;

        if(this.props.world)
        {
            const newWorld = Exportable.Import(this.props.world);

            if(newWorld && newWorld instanceof World)
            {
                world = newWorld;
            }
        }

        if(!world)
        {
            world = Shared.CreateSampleWorld(16);
        }

        // Add player
        const player = new PlayerActor();
        const arrow = new ArrowActor();

        arrow.Init({
            ignore: true,
            body: Body.CreateBoxBody(new Vector(0.1, 0.1), 0, new Vector(0, 0))
        });

        player.Init({
            body: Body.CreateBoxBody(new Vector(1, 1), 0, new Vector(2, 2)),
            texture: "res/player.png",
            speed: 1500,
            health: 1,
            rotSpeed: 200,
            arrow: arrow
        });

        world.Add(player);
    
        // Render the server
        const renderer = new Renderer({
            canvas: this.canvas,
            world: world, 
            debug: true,
            viewport: new Vector(10, 10)
        });
    
        await renderer.Load();
            
        const keys = 
        {
            up: "ARROWUP", 
            left: "ARROWLEFT", 
            down: "ARROWDOWN", 
            right: "ARROWRIGHT",
            shoot: " "
        };

        renderer.OnDraw.Add(() => 
        {
            Shared.SetupControl(player, keys);
            renderer.SetCenter(player.GetBody().GetPosition());
        });

        renderer.Start();
    }

    public componentDidMount(): void
    {
        this.init();
    }

    public renderInner(): JSX.Element
    {
        return <canvas style={{ width: "100%", background: "black" }} ref={c => this.canvas = c} />;
    }

    public render(): JSX.Element
    {
        return (
            <Cristal 
                onClose={() => this.props.onClose()}
                title="One Player Debug"
                initialSize={{width: 500, height: 500}}
                isResizable={true}
                initialPosition="top-center">
                    {this.renderInner()}
            </Cristal>
        );
    }
}