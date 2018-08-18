import { Map } from "./lib/Map";
import { Coord } from "./lib/Coord";
import { GroundCell } from './lib/Element/Cell/GroundCell';
import { PlayerActor } from './lib/Element/Actor/PlayerActor';
import { Server } from './lib/Net/Server';
import { Renderer } from "./lib/Renderer";
import { Keyboard } from "./lib/Util/Keyboard";
import { Sender } from "./lib/Net/Sender";
import { FakeChannel } from "./lib/Net/FakeChannel";
import { Receiver } from "./lib/Net/Receiver";
import { PeerChannel } from "./lib/Net/PeerChannel";
import { Tools } from "./lib/Util/Tools";
import { Exportable } from "./lib/Exportable";
import { IExportObject } from "./lib/IExportObject";

// HTML elements
const gameCanvas = <HTMLCanvasElement>document.getElementById("game-canvas");
const addButton = <HTMLButtonElement>document.getElementById("add-button");
const messageDiv = <HTMLDivElement>document.getElementById("message-div");

// Wire up listeners
addButton.onclick = () => ClickAdd();

// Tab ID
const tabId = Tools.Unique();

// Game objects
const map: Map = new Map();

// For client or server
let channel: PeerChannel = null;
let server: Server = null;

/**
 * Type of the hash format.
 */
enum HashType
{
    Offer,
    Answer
}

/**
 * Structure of the hash string.
 */
interface HashFormat
{
    Tab: string;
    Type: HashType,
    Payload: string;
}

/**
 * Set a message on the screen.
 * @param message 
 */
const SetMessage = (message: string): void =>
{
    messageDiv.innerText = message;
}

/**
 * Copy text to clipboard.
 * @param text 
 */
const ClipboardCopy = async (text: string): Promise<void> =>
{
    const success = await Tools.ClipboardCopy(text);

    if(!success)
    {
        prompt("", text);
    }
}

/**
 * Construct a new URL from HashFormat.
 * @param hashFormat 
 */
const ConstructUrl = (hashFormat: HashFormat): string =>
{
    return location.origin + location.pathname + "#" + 
        encodeURI(btoa(JSON.stringify(hashFormat)));
};

/**
 * Read the location hash.
 */
const ReadHash = (): HashFormat =>
{
    try 
    {
        return JSON.parse(atob(decodeURI(location.hash.substr(1))));
    }
    catch(e)
    {
        return {
            Tab: null,
            Type: null,
            Payload: null
        };
    }
};

/**
 * Create an offer.
 */
const ClickAdd = async (): Promise<void> =>
{
    if(!server)
    {
        return;
    }

    const channel = new PeerChannel();
    const offer = await channel.Offer();
    const url = ConstructUrl({
        Tab: tabId,
        Type: HashType.Offer,
        Payload: offer
    });
    
    ClipboardCopy(url);
    SetMessage("Offer copied to clipboard!");

    channel.OnOpen = () => 
    {
        SetMessage("A new player joined!");
        server.Add(new Sender(channel));
    };

    while(true)
    {
        const answer = localStorage.getItem(tabId);

        if(answer)
        {
            channel.Finish(answer);
            localStorage.removeItem(tabId);
            break;
        }

        await Tools.Wait(1000);
    }
};

/**
 * Create receiver (and server).
 */
const CreateReceiver = async (renderer: Renderer): Promise<Receiver> =>
{
    if(channel && !channel.IsOfferor())
    {
        return new Receiver(channel, map);
    }

    // Create server map, load it, create server
    try 
    {
        const rawMap = JSON.parse(await Tools.Get("res/map.json"));
        const serverMap = Exportable.Import(rawMap);

        server = new Server(serverMap);

        // Use the tick of the local client on the server
        renderer.OnDraw.Add(() => serverMap.OnTick.Call());
    }
    catch(e)
    {
        return null;
    }

    // Show add button
    addButton.style.display = "block";

    // Create a fake channel
    const localA = new FakeChannel();
    const localB = new FakeChannel();

    localA.SetOther(localB);
    localB.SetOther(localA);

    // Add connection to the server
    server.Add(new Sender(localA));

    // Connect client to the server
    return new Receiver(localB, map);
}

/**
 * Game cycle
 * @param player 
 * @param up
 * @param left
 * @param down
 * @param right
 * @param space
 */
const OnDraw = (player: PlayerActor, { up, left, down, right, space }) =>
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

    if(Keyboard.Keys[space])
    {
        player.Shoot();
    }
};

/**
 * Start game.
 */
const Start = async () =>
{
    Keyboard.Init();

    const renderer = new Renderer(map, gameCanvas);
    const receiver = await CreateReceiver(renderer);

    receiver.OnPlayer = async player =>
    {
        map.Origin = player.Id;

        await renderer.Load();
        
        const keys = 
        {
            up: "ARROWUP", 
            left: "ARROWLEFT", 
            down: "ARROWDOWN", 
            right: "ARROWRIGHT",
            space: " "
        };

        renderer.OnDraw.Add(() => OnDraw(player, keys));
        renderer.Start();
    };
};

/**
 * Launch the debugger.
 */
const Debugger = async (delay = 10) =>
{
    document.body.innerHTML = 
        "<canvas id='canvasA'></canvas>A" +
        "<canvas id='canvasB'></canvas>B" +
        "<canvas id='canvasS'></canvas>S";

    Keyboard.Init();

    const mapA: Map = new Map();
    const mapB: Map = new Map();

    // For debug purposes
    mapA["_Name"] = "mapA";
    mapB["_Name"] = "mapB";
    
    const canvasA = <HTMLCanvasElement>document.getElementById("canvasA");
    const canvasB = <HTMLCanvasElement>document.getElementById("canvasB");
    const canvasS = <HTMLCanvasElement>document.getElementById("canvasS");
    
    const rendererA = new Renderer(mapA, canvasA);
    const rendererB = new Renderer(mapB, canvasB);
    
    const channelA1 = new FakeChannel(delay);
    const channelA2 = new FakeChannel(delay);
    const channelB1 = new FakeChannel(delay);
    const channelB2 = new FakeChannel(delay);
    
    channelA1.SetOther(channelA2);
    channelA2.SetOther(channelA1);
    channelB1.SetOther(channelB2);
    channelB2.SetOther(channelB1);

    const receiverA = new Receiver(channelA1, mapA);
    const receiverB = new Receiver(channelB1, mapB);
    
    const raw: IExportObject = JSON.parse(await Tools.Get("res/map.json"));
    const mapServer: Map = Exportable.Import(raw);
    const server = new Server(mapServer);
    
    server.Add(new Sender(channelA2));
    server.Add(new Sender(channelB2));
    
    receiverA.OnPlayer = async player =>
    {
        mapA.Origin = player.Id;

        await rendererA.Load();
        
        const keys = 
        {
            up: "ARROWUP", 
            left: "ARROWLEFT", 
            down: "ARROWDOWN", 
            right: "ARROWRIGHT",
            space: " "
        };

        rendererA.OnDraw.Add(() => OnDraw(player, keys));
        rendererA.Start();
    };
    
    receiverB.OnPlayer = async player =>
    {
        mapB.Origin = player.Id;

        await rendererB.Load();

        const keys = 
        {
            up: "W", 
            left: "A", 
            down: "S", 
            right: "D",
            space: "E"
        };
        
        rendererB.OnDraw.Add(() => OnDraw(player, keys));
        rendererB.Start();
    };

    // Render the server
    const rendererS = new Renderer(mapServer, canvasS);

    await rendererS.Load();

    rendererS.Start();

    // For debug
    Tools.Extract(window, {
        // Instances
        mapA,
        mapB,
        mapServer,
        // Classes
        Map,
        Tools,
        Exportable,
        Coord,
        GroundCell,
        PlayerActor
    });
};

/**
 * Main function.
 */
const Main = async (): Promise<void> =>
{
    // Debugger
    if(location.hash.includes("debug"))
    {
        Debugger();
        return;
    }

    const hash = ReadHash();

    // If it is an offer, create an answer and wait for an open channel.
    if(hash.Type == HashType.Offer)
    {
        channel = new PeerChannel();
        channel.OnOpen = () => Start();

        const answer = await channel.Answer(hash.Payload);
        const url = ConstructUrl({
            Tab: hash.Tab,
            Type: HashType.Answer,
            Payload: answer
        });

        ClipboardCopy(url);
        SetMessage("Answer copied to clipboard!");
    }

    // If it is an answer, give it to the server tab using the local storage
    else if(hash.Type == HashType.Answer)
    {
        localStorage.setItem(hash.Tab, hash.Payload);
        SetMessage("You can close this tab!");
    }

    // If no hash is present, start the game
    else
    {
        Start();
    }
};

// Start the main function
Main();