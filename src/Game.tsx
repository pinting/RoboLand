import * as React from "react";
import "./Game.css";
import { World } from "./lib/World";
import { Server } from './lib/Net/Server';
import { Renderer } from "./lib/Renderer";
import { Host } from "./lib/Net/Host";
import { FakeChannel } from "./lib/Net/Channel/FakeChannel";
import { Client } from "./lib/Net/Client";
import { PeerChannel } from "./lib/Net/Channel/PeerChannel";
import { Exportable } from "./lib/Exportable";
import { Http } from "./lib/Util/Http";
import { Tools } from "./lib/Util/Tools";
import { Helper } from "./Helper";
import { Shared } from "./Shared";
import { Constants } from "./Constants";
import { PlayerActor } from "./lib/Unit/Actor/PlayerActor";
import { Vector } from "./lib/Geometry/Vector";

/**
 * Type of the connect format.
 */
enum ConnectType
{
    Offer,
    Answer
}

/**
 * Structure of the connect string.
 */
interface ConnectFormat
{
    Tab: string;
    Type: ConnectType,
    Payload: string;
}

/**
 * Props of the Game view.
 */
interface GameProps {
    // Empty
}

/**
 * State of the Game view.
 */
interface GameState {
    message: string;
    showAdd: boolean;
}

export class Game extends Shared<GameProps, GameState>
{
    public static Name = "game";

    private canvas: HTMLCanvasElement;

    private tabId: string = Tools.Unique();
    private world: World = new World();

    private channel: PeerChannel;
    private server: Server;

    /**
     * Construct a new Game view.
     */
    constructor(props) 
    {
        super(props);
    
        this.state = {
            message: "",
            showAdd: false
        };
    }

    /**
     * Construct a new URL from ConnectFormat.
     * @param format 
     */
    private static CreateUrl(format: ConnectFormat)
    {
        return location.origin + 
            location.pathname + 
            "#" + 
            Helper.CreateHash({
                [Constants.Params.View]: Game.Name,
                [Constants.Params.Connect]: btoa(JSON.stringify(format))
            });
    };

    /**
     * Read the connect parameter of the location hash.
     */
    private static ReadConnect(): ConnectFormat
    {
        try 
        {
            const connect = Helper.GetParam(Constants.Params.Connect);

            return JSON.parse(atob(connect));
        }
        catch(e)
        {
            return {
                Tab: null,
                Type: null,
                Payload: null
            };
        }
    }

    /**
     * Create an offer.
     */
    private async ClickAdd(): Promise<void>
    {
        if(!this.server)
        {
            return;
        }

        const channel = new PeerChannel();
        const offer = await channel.Offer();
        const url = Game.CreateUrl({
            Tab: this.tabId,
            Type: ConnectType.Offer,
            Payload: offer
        });
        
        Helper.SetClipboard(url);
        this.setState({ message: "Offer copied to clipboard!" });

        channel.OnOpen = () => 
        {
            this.setState({ message: "A new player joined!" });
            this.server.Add(new Host(channel, this.server));
        };

        while(true)
        {
            const answer = localStorage.getItem(this.tabId);

            if(answer)
            {
                channel.Finish(answer);
                localStorage.removeItem(this.tabId);
                break;
            }

            await Tools.Wait(1000);
        }
    }

    /**
     * Create receiver (and server).
     */
    private async CreateReceiver(renderer: Renderer): Promise<Client>
    {
        if(this.channel && !this.channel.IsOfferor())
        {
            return new Client(this.channel, this.world);
        }

        // Create server world, load it, create server
        const raw = JSON.parse(await Http.Get("res/world.json"));
        const serverWorld = Exportable.Import(raw);

        this.server = new Server(serverWorld);

        // Use the tick of the local client on the server
        renderer.OnDraw.Add(dt => serverWorld.OnTick.Call(dt));

        // Enable add button
        this.setState({ showAdd: true });

        // Create a fake channel
        const localA = new FakeChannel();
        const localB = new FakeChannel();

        localA.SetOther(localB);
        localB.SetOther(localA);

        // Add connection to the server
        this.server.Add(new Host(localA, this.server));

        // Connect client to the server
        return new Client(localB, this.world);
    }

    /**
     * Start the game.
     */
    private async Start()
    {
        window["world"] = this.world;

        const renderer = new Renderer({ 
            canvas: this.canvas, 
            world: this.world,
            debug: false
        });
        const receiver = await this.CreateReceiver(renderer);

        receiver.OnPlayer = async player =>
        {
            window["temp1"] = player;
            this.world.Origin = player.GetId();

            await renderer.Load();
            
            const keys = 
            {
                up: "ARROWUP", 
                left: "ARROWLEFT", 
                down: "ARROWDOWN", 
                right: "ARROWRIGHT",
                space: " "
            };

            renderer.OnDraw.Add(() => this.SetupControl(player, keys));
            renderer.Start();
        };
    }

    /**
     * Determinate by the connect parameter if this is a host or a client.
     */
    private async Main(): Promise<void>
    {
        const p1 = new PlayerActor();
        const p2 = new PlayerActor();

        p1.Init({
            id: Tools.Unique(),
            position: new Vector(10, 10),
            size: new Vector(1, 1),
            angle: Math.PI/6,
            speed: 100.0,
            damage: 0.1,
            health: 1.0
        });

        p2.Init({
            id: Tools.Unique(),
            position: new Vector(10.5, 10.5),
            size: new Vector(1, 1),
            angle: Math.PI/6,
            speed: 100.0,
            damage: 0.1,
            health: 1.0
        });

        const connect = Game.ReadConnect();

        // If it is an offer, create an answer and wait for an open channel.
        if(connect.Type == ConnectType.Offer)
        {
            this.channel = new PeerChannel();
            this.channel.OnOpen = () => this.Start();

            const answer = await this.channel.Answer(connect.Payload);
            const url = Game.CreateUrl({
                Tab: connect.Tab,
                Type: ConnectType.Answer,
                Payload: answer
            });

            Helper.SetClipboard(url);
            this.setState({ message: "Answer copied to clipboard!" });
        }

        // If it is an answer, give it to the server tab using the local storage
        else if(connect.Type == ConnectType.Answer)
        {
            localStorage.setItem(connect.Tab, connect.Payload);
            this.setState({ message: "You can close this tab!" });
        }

        // If no connect is present, start the game
        else
        {
            this.Start();
        }
    }

    /**
     * Execute the main function when the component is mounted.
     */
    public componentDidMount(): void
    {
        this.Main();
    }

    /**
     * Render the Game view.
     */
    public render(): JSX.Element
    {
        return (
            <div>
                <div className="game-center">
                    <canvas ref={c => this.canvas = c}></canvas>
                </div>
                <div className="game-corner">
                    {this.state.showAdd && 
                        <button onClick={this.ClickAdd.bind(this)}>Add</button>}
                </div>
                <div className="game-message">
                    {this.state.message}
                </div>
            </div>
        );
    }
}