import * as React from "react";
import { Keyboard } from "./lib/Util/Keyboard";
import { World } from "./lib/World";
import { Renderer } from "./lib/Renderer";
import { FakeChannel } from "./lib/Net/Channel/FakeChannel";
import { Client } from "./lib/Net/Client";
import { IDump } from "./lib/IDump";
import { Server } from "./lib/Net/Server";
import { Exportable } from "./lib/Exportable";
import { Host } from "./lib/Net/Host";
import { Http } from "./lib/Util/Http";
import { Vector } from "./lib/Geometry/Vector";
import { Matrix } from "./lib/Geometry/Matrix";
import { GroundCell } from "./lib/Unit/Cell/GroundCell";
import { PlayerActor } from "./lib/Unit/Actor/PlayerActor";
import { StoneCell } from "./lib/Unit/Cell/StoneCell";
import { Logger, LogType } from "./lib/Util/Logger";
import { SimplexNoise } from "./lib/Util/SimplexNoise";
import { Shared } from "./Shared";
import { Tools } from "./lib/Util/Tools";
import { ResourceManager } from "./lib/Util/ResourceManager";
import { Constants } from "./Constants";
import { Polygon } from "./lib/Geometry/Polygon";
import { Body } from "./lib/Physics/Body";
import NetTest from "./lib/Test/NetTest";
import { Helper } from "./Helper";

export class Debug extends Shared
{
    public static Name = "debug";

    private canvasA: HTMLCanvasElement;
    private canvasB: HTMLCanvasElement;
    private canvasS: HTMLCanvasElement;

    public async OnePlayer()
    {
        const world = World.CreateBox(16);

        const player = new PlayerActor();

        player.Init({
            body: Body.CreateBoxBody(new Vector(1, 1), 0, new Vector(2, 2)),
            texture: "res/player.png",
            speed: 1500,
            damage: 0.1,
            health: 1,
            rotSpeed: 200
        });

        world.Add(player);
    
        // Render the server
        const renderer = new Renderer({ 
            canvas: this.canvasS,
            world: world, 
            debug: true
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

        renderer.OnDraw.Add(() => this.SetupControl(player, keys));
        renderer.Start();

    }

    public async TwoPlayer()
    {
        const delay = Constants.DebugDelay;

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
        
        const world: World = World.CreateBox(16);
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
                this.SetupControl(player, keys);
                rendererB.SetCenter(player.GetBody().GetOffset());
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
                this.SetupControl(player, keys);
                rendererA.SetCenter(player.GetBody().GetOffset());
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

    /**
     * Create 2 clients and 1 server and render everthing onto the 3 canvases.
     */
    public async Main()
    {
        // For debug
        Tools.Extract(window, {
            World,
            Tools,
            Exportable,
            Vector,
            Matrix,
            GroundCell,
            PlayerActor,
            StoneCell,
            Logger,
            SimplexNoise,
            ResourceManager,
            Polygon,
            Body,
            Http
        });

        Logger.Type = LogType.Warn;
        Keyboard.Init();

        this.TwoPlayer();
    }

    /**
     * Execute the main function when the component is mounted.
     */
    public componentDidMount(): void
    {
        this.Main();
    }

    /**
     * Render the Debug view.
     */
    public render(): JSX.Element
    {
        return (
            <div>
                <canvas ref={c => this.canvasA = c}></canvas>
                <canvas ref={c => this.canvasB = c}></canvas>
                <canvas ref={c => this.canvasS = c}></canvas>
            </div>
        );
    }
}