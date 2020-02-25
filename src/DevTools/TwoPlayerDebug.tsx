import * as React from "react";
import Cristal from "react-cristal";

import { Logger, LogType } from "../lib/Util/Logger";
import { Shared } from "../Game/Shared";
import { Renderer } from "../lib/Renderer";
import { World } from "../lib/World";
import { FakeChannel } from "../lib/Net/Channel/FakeChannel";
import { Client } from "../lib/Net/Client";
import { Server } from "../lib/Net/Server";
import { Host } from "../lib/Net/Host";
import { Tools } from "../lib/Util/Tools";
import { ResourceManager } from "../lib/Util/ResourceManager";
import { Exportable } from "../lib/Exportable";
import { Keyboard } from "../lib/Util/Keyboard";
import { Dump } from "../lib/Dump";

interface ViewProps 
{
    world?: Dump;
    close: () => void;
}

interface ViewState 
{

}

export class TwoPlayerDebug extends React.PureComponent<ViewProps, ViewState>
{
    private canvasA: HTMLCanvasElement;
    private canvasB: HTMLCanvasElement;
    private canvasS: HTMLCanvasElement;

    private rendererA: Renderer;
    private rendererB: Renderer;

    /**
     * Create 2 clients and 1 server and render everthing onto the 3 canvases.
     */
    protected async init()
    {
        Logger.Type = LogType.Warn;
        Keyboard.Init();
        
        const delay = 1;

        const worldA: World = new World();
        const worldB: World = new World();
    
        // Tagging for debug purposes
        worldA["_Name"] = "worldA";
        worldB["_Name"] = "worldB";
        
        this.rendererA = new Renderer({ 
            canvas: this.canvasA,
            world: worldA,
            debug: true
        });

        this.rendererB = new Renderer({
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

        const rootResource = ResourceManager.ByUri(Shared.DEFAULT_WORLD_URI);
        let world: World;

        if(!rootResource)
        {
            Logger.Warn("Default root resource is not available", Shared.DEFAULT_WORLD_URI);
            return;
        }
        
        const raw = Tools.ANSIToUTF16(rootResource.Buffer);
        const rootDump = JSON.parse(raw) as Dump;
        const dump = Dump.Resolve(rootDump);

        world = Exportable.Import(dump);

        const server = new Server(world);
        
        server.Add(new Host(channelA2, server));
        server.Add(new Host(channelB2, server));
        
        receiverA.OnPlayer = async player =>
        {
            worldA.Origin = player.GetId();
    
            await this.rendererA.Load();
            
            const keys = 
            {
                up: "ARROWUP", 
                left: "ARROWLEFT", 
                down: "ARROWDOWN", 
                right: "ARROWRIGHT",
                shoot: " "
            };
            
            this.rendererB.OnDraw.Add(() => 
            {
                Shared.SetupControl(player, keys);
                this.rendererB.SetCenter(player.GetBody().GetPosition());
            });

            this.rendererA.Start();
        };
        
        receiverB.OnPlayer = async player =>
        {
            worldB.Origin = player.GetId();
    
            await this.rendererB.Load();
    
            const keys = 
            {
                up: "W", 
                left: "A", 
                down: "S", 
                right: "D",
                shoot: "E"
            };
            
            this.rendererB.OnDraw.Add(() => 
            {
                Shared.SetupControl(player, keys);
                this.rendererA.SetCenter(player.GetBody().GetPosition());
            });

            this.rendererB.Start();
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
            world: world
        });
    }

    public componentWillUnmount(): void
    {
        this.rendererA.Stop();
        this.rendererB.Stop();
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
                onClose={() => this.props.close()}
                title="Two Player Debug"
                initialSize={{width: 700, height: 300}}
                isResizable={true}
                initialPosition="top-center">
                    {this.renderInner()}
            </Cristal>
        );
    }
}