import * as React from "react";
import Cristal from "react-cristal";
import * as Bootstrap from "reactstrap";

import { World } from "../lib/World";
import { Server } from '../lib/Net/Server';
import { Renderer } from "../lib/Renderer";
import { Host } from "../lib/Net/Host";
import { FakeChannel } from "../lib/Net/Channel/FakeChannel";
import { Client } from "../lib/Net/Client";
import { PeerChannel } from "../lib/Net/Channel/PeerChannel";
import { Tools } from "../lib/Util/Tools";
import { Helper } from "../Helper";
import { Shared } from "./Shared";
import { Keyboard } from "../lib/Util/Keyboard";
import { Params } from "../Params";
import { ResourceManager } from "../lib/Util/ResourceManager";
import { Exportable } from "../lib/Exportable";
import { Http } from "../lib/Util/Http";
import { Dump } from "../lib/Dump";

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

interface GameProps {
    // Empty
}

interface GameState {
    message: string;
    showAdd: boolean;
}

export class Game extends React.PureComponent<GameProps, GameState>
{
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
        
        Keyboard.Init();
        Shared.RegisterDependencies();
    
        this.state = {
            message: "",
            showAdd: false
        };
    }

    /**
     * Construct a new URL from ConnectFormat.
     * @param format 
     */
    private static createUrl(format: ConnectFormat)
    {
        return location.origin + 
            location.pathname + 
            "#" + 
            Helper.CreateHash({
                [Params.Connect]: btoa(JSON.stringify(format))
            });
    };

    /**
     * Read the connect parameter of the location hash.
     */
    private static readConnect(): ConnectFormat
    {
        try 
        {
            const connect = Helper.GetParam(Params.Connect);

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
    private async clickAdd(): Promise<void>
    {
        if(!this.server)
        {
            return;
        }

        const channel = new PeerChannel();
        const offer = await channel.Offer();
        const url = Game.createUrl({
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
    private async createReceiver(renderer: Renderer): Promise<Client>
    {
        if(this.channel && !this.channel.IsOfferor())
        {
            return new Client(this.channel, this.world);
        }

        // Load resources
        const buffer = await Http.Get("res/default.roboland");
        
        await ResourceManager.Load(buffer);
        
        const rootResource = ResourceManager.ByUri(World.DEFAULT_WORLD_URI);
        const rootDump = JSON.parse(Tools.ANSIToUTF16(rootResource.Buffer)) as Dump;
        const dump = Dump.Resolve(rootDump);
        const world = Exportable.Import(dump);

        this.server = new Server(world);

        // Use the tick of the local client on the server
        renderer.OnDraw.Add(dt => world.OnTick.Call(dt));

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
    private async start()
    {
        const renderer = new Renderer({ 
            canvas: this.canvas, 
            world: this.world,
            disableShadows: true
        });
        
        const receiver = await this.createReceiver(renderer);

        receiver.OnPlayer = async player =>
        {
            this.world.Origin = player.GetId();

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
        };
    }

    /**
     * Determinate by the connect parameter if this is a host or a client.
     */
    private async main(): Promise<void>
    {
        const connect = Game.readConnect();

        // If it is an offer, create an answer and wait for an open channel.
        if(connect.Type == ConnectType.Offer)
        {
            this.channel = new PeerChannel();
            this.channel.OnOpen = () => this.start();

            const answer = await this.channel.Answer(connect.Payload);
            const url = Game.createUrl({
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
            this.start();
        }
    }

    /**
     * Execute the main function when the component is mounted.
     */
    public componentDidMount(): void
    {
        this.main();
    }

    /**
     * Render the Game view.
     */
    public render(): JSX.Element
    {
        const containerStyle: React.CSSProperties = {
            width: "100%",
            height: "100%",
            background: "black",
            position: "fixed",
            top: 0,
            left: 0
        };

        const canvasHolderStyle: React.CSSProperties = {
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)"
        };

        const bottomRightStyle: React.CSSProperties = {
            position: "fixed",
            bottom: 0,
            right: 0
        };

        const messageStyle: React.CSSProperties = {
            position: "fixed",
            bottom: "25px",
            left: 0,
            width: "100%",
            textAlign: "center"
        };

        const addButtonStyle: React.CSSProperties = {
            margin: "20px",
            width: "50px",
            height: "50px",
            borderRadius: "50px"
        };

        return (
            <div style={containerStyle}>
                <div style={canvasHolderStyle}>
                    <canvas ref={c => this.canvas = c}></canvas>
                </div>
                <div style={bottomRightStyle}>
                    {this.state.showAdd && 
                        <button
                            style={addButtonStyle}
                            onClick={this.clickAdd.bind(this)}>
                                Add
                        </button>}
                </div>
                <div style={messageStyle}>
                    {this.state.message}
                </div>
            </div>
        );
    }
}