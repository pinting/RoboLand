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
import { NormalCell } from "./lib/Unit/Cell/NormalCell";
import { PlayerActor } from "./lib/Unit/Actor/PlayerActor";
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
import { ArrowActor } from "./lib/Unit/Actor/ArrowActor";

export class Debug extends Shared
{
    public static Name = "debug";

    private canvasHolder: HTMLDivElement;
    
    public async RunTests()
    {
        // Run tests
        Logger.Type = LogType.Info;

        try
        {
            await NetTest();
        }
        catch(e)
        {
            Logger.Warn(this, e);
        }
        finally
        {
            Logger.Info(this, "Tests complete!");
        }
    }

    public async RunOnePlayer()
    {
        // Clear
        this.canvasHolder.innerHTML = "";

        // New canvas
        const canvas = document.createElement("canvas");

        // Append canvas to the holder
        this.canvasHolder.appendChild(canvas);

        // Create world
        const world = this.CreateSampleWorld(16);

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
            canvas: canvas,
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

        renderer.OnDraw.Add(() => 
        {
            this.SetupControl(player, keys);
            renderer.SetCenter(player.GetBody().GetOffset());
        });

        renderer.Start();

    }

    public async RunTwoPlayer()
    {
        // Clear
        this.canvasHolder.innerHTML = "";

        // New canvas
        const canvasA = document.createElement("canvas");
        const canvasB = document.createElement("canvas");
        const canvasS = document.createElement("canvas");

        // Append canvas to the holder
        this.canvasHolder.appendChild(canvasA);
        this.canvasHolder.appendChild(canvasB);
        this.canvasHolder.appendChild(canvasS);

        const delay = Constants.DebugDelay;

        const worldA: World = new World();
        const worldB: World = new World();
    
        // Tagging for debug purposes
        worldA["_Name"] = "worldA";
        worldB["_Name"] = "worldB";
        
        const rendererA = new Renderer({ 
            canvas: canvasA,
            world: worldA,
            debug: true
        });

        const rendererB = new Renderer({
            canvas: canvasB,
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
        
        const world: World = this.CreateSampleWorld(16);
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
            canvas: canvasS,
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
            NormalCell,
            PlayerActor,
            Logger,
            SimplexNoise,
            ResourceManager,
            Polygon,
            Body,
            Http
        });

        Logger.Type = LogType.Warn;
        Keyboard.Init();
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
                <button onClick={this.RunOnePlayer.bind(this)}>One Player</button>
                <button onClick={this.RunTwoPlayer.bind(this)}>Two Player</button>
                <button onClick={this.RunTests.bind(this)}>Run Tests</button>
                <div ref={c => this.canvasHolder = c}></div>
            </div>
        );
    }
}