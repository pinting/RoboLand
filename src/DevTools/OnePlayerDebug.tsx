import * as React from "react";
import * as Bootstrap from "reactstrap";
import Cristal from "react-cristal";

import { Logger, LogType } from "../lib/Util/Logger";
import { Shared } from "../Game/Shared";
import { PlayerActor } from "../lib/Unit/Actor/PlayerActor";
import { ArrowActor } from "../lib/Unit/Actor/ArrowActor";
import { Body } from "../lib/Physics/Body";
import { Vector } from "../lib/Geometry/Vector";
import { World } from "../lib/World";
import { Tools } from "../lib/Util/Tools";
import { ResourceManager } from "../lib/Util/ResourceManager";
import { Exportable } from "../lib/Exportable";
import { Keyboard } from "../lib/Util/Keyboard";
import { IDump } from "../lib/IDump";
import { Renderer } from "../lib/Renderer";

interface ViewProps
{
    close: () => void;
    world?: IDump;
}

interface ViewState
{

}

export class OnePlayerDebug extends React.PureComponent<ViewProps, ViewState>
{
    private canvas: HTMLCanvasElement;
    private renderer: Renderer;
    
    private async init(): Promise<void>
    {
        Logger.Type = LogType.Warn;
        Keyboard.Init();

        // Load or create the world
        const rootResource = ResourceManager.ByUri(Shared.DEFAULT_WORLD_URI);
        let world: World;

        if(rootResource)
        {
            const rootDump = JSON.parse(Tools.BufferToUTF16(rootResource.Buffer)) as IDump;
            const dump = Exportable.Resolve(rootDump);
    
            world = Exportable.Import(dump);
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
        this.renderer = new Renderer({
            canvas: this.canvas,
            world: world, 
            debug: true,
            viewport: new Vector(10, 10)
        });
    
        await this.renderer.Load();
            
        const keys = 
        {
            up: "ARROWUP", 
            left: "ARROWLEFT", 
            down: "ARROWDOWN", 
            right: "ARROWRIGHT",
            shoot: " "
        };

        this.renderer.OnDraw.Add(() => 
        {
            Shared.SetupControl(player, keys);
            this.renderer.SetCenter(player.GetBody().GetPosition());
        });

        this.renderer.Start();
    }

    public componentDidMount(): void
    {
        this.init();
    }

    public componentWillUnmount(): void
    {
        this.renderer.Stop();
    }

    private renderInner(): JSX.Element
    {
        return <canvas style={{ width: "100%", background: "black" }} ref={c => this.canvas = c} />;
    }

    public render(): JSX.Element
    {
        return (
            <Cristal 
                onClose={() => this.props.close()}
                title="One Player Debug"
                initialSize={{width: 500, height: 500}}
                isResizable={true}
                initialPosition="top-center">
                    {this.renderInner()}
            </Cristal>
        );
    }
}