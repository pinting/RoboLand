import * as React from "react";
import Cristal from "react-cristal";

import { Logger, LogType } from "../lib/Util/Logger";
import { Shared } from "../Game/Shared";
import { PlayerActor } from "../lib/Unit/Actor/PlayerActor";
import { Body } from "../lib/Physics/Body";
import { Vector } from "../lib/Geometry/Vector";
import { Polygon } from "../lib/Geometry/Polygon";
import { Matrix } from "../lib/Geometry/Matrix";
import { Renderer } from "../lib/Renderer";
import { World } from "../lib/World";
import { FakeChannel } from "../lib/Net/Channel/FakeChannel";
import { Client } from "../lib/Net/Client";
import { Server } from "../lib/Net/Server";
import { Host } from "../lib/Net/Host";
import { Tools } from "../lib/Util/Tools";
import { ResourceManager } from "../lib/Util/ResourceManager";
import { SimplexNoise } from "../lib/Util/SimplexNoise";
import { Http } from "../lib/Util/Http";
import { Exportable } from "../lib/Exportable";
import { Keyboard } from "../lib/Util/Keyboard";
import { NormalCell } from "../lib/Unit/Cell/NormalCell";
import { IDump } from "../lib/IDump";

interface ViewProps {
    world?: IDump;
    onClose: () => void;
}

interface ViewState {

}

export class TwoPlayerView extends React.PureComponent<ViewProps, ViewState>
{
    private canvasA: HTMLCanvasElement;
    private canvasB: HTMLCanvasElement;
    private canvasS: HTMLCanvasElement;

    /**
     * Create 2 clients and 1 server and render everthing onto the 3 canvases.
     */
    public async init()
    {
        Logger.Type = LogType.Warn;
        Keyboard.Init();
        
        const delay = 1;

        const worldA: World = new World();
        const worldB: World = new World();
    
        // Tagging for debug purposes
        worldA["_Name"] = "worldA";
        worldB["_Name"] = "worldB";
        
        const rendererA = new Renderer({ 
            canvas: this.canvasA,
            world: worldA,
            debug: true
        });

        const rendererB = new Renderer({
            canvas: this.canvasB,
            world: worldB,
            debug: true
        });
        
        const channelA1 = new FakeChannel(delay);
        const channelA2 = new FakeChannel(delay);
        const channelB1 = new FakeChannel(delay);
        const channelB2 = new FakeChannel(delay);
        
        channelA1.SetOther(channelA2);
        channelA2.SetOther(channelA1);
        channelB1.SetOther(channelB2);
        channelB2.SetOther(channelB1);
    
        const receiverA = new Client(channelA1, worldA)
        const receiverB = new Client(channelB1, worldB);
        
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

        const server = new Server(world);
        
        server.Add(new Host(channelA2, server));
        server.Add(new Host(channelB2, server));
        
        receiverA.OnPlayer = async player =>
        {
            worldA.Origin = player.GetId();
    
            await rendererA.Load();
            
            const keys = 
            {
                up: "ARROWUP", 
                left: "ARROWLEFT", 
                down: "ARROWDOWN", 
                right: "ARROWRIGHT",
                shoot: " "
            };
            
            rendererB.OnDraw.Add(() => 
            {
                Shared.SetupControl(player, keys);
                rendererB.SetCenter(player.GetBody().GetPosition());
            });

            rendererA.Start();
        };
        
        receiverB.OnPlayer = async player =>
        {
            worldB.Origin = player.GetId();
    
            await rendererB.Load();
    
            const keys = 
            {
                up: "W", 
                left: "A", 
                down: "S", 
                right: "D",
                shoot: "E"
            };
            
            rendererB.OnDraw.Add(() => 
            {
                Shared.SetupControl(player, keys);
                rendererA.SetCenter(player.GetBody().GetPosition());
            });

            rendererB.Start();
        };
    
        // Render the server
        const rendererS = new Renderer({ 
            canvas: this.canvasS,
            world: world, 
            debug: false,
            disableShadows: true,
            center: world.GetSize().Scale(1 / 2),
            viewport: world.GetSize(),
            dotPerPoint: 10
        });
    
        await rendererS.Load();
    
        rendererS.Start();

        // For debug
        Tools.Extract(window, {
            worldA: worldA,
            worldB: worldB,
            worldS: world
        });
    }

    public componentDidMount(): void
    {
        this.init();
    }

    public renderInner(): JSX.Element
    {
        return (
            <div>
                <canvas style={{ width: "33%", background: "black" }} ref={c => this.canvasA = c} />
                <canvas style={{ width: "33%", background: "black" }} ref={c => this.canvasB = c} />
                <canvas style={{ width: "33%", background: "black" }} ref={c => this.canvasS = c} />
            </div>
        );
    }

    public render(): JSX.Element
    {
        return (
            <Cristal 
                onClose={() => this.props.onClose()}
                title="Two Player Debug"
                initialSize={{width: 700, height: 300}}
                isResizable={true}
                initialPosition="top-center">
                    {this.renderInner()}
            </Cristal>
        );
    }
}