import { Board } from "./lib/Board";
import { Coord } from "./lib/Coord";
import { GroundCell } from './lib/Element/Cell/GroundCell';
import { StoneCell } from './lib/Element/Cell/StoneCell';
import { PlayerActor } from './lib/Element/Actor/PlayerActor';
import { Server } from './lib/Net/Server';
import { Renderer } from "./lib/Renderer";
import { Keyboard } from "./lib/Util/Keyboard";
import { Sender } from "./lib/Net/Sender";
import { FakeChannel } from "./lib/Net/Channel/FakeChannel";
import { Receiver } from "./lib/Net/Receiver";
import { PeerChannel } from "./lib/Net/Channel/PeerChannel";
import { Tools } from "./lib/Util/Tools";
import { Exportable } from "./lib/Exportable";
import { IExportObject } from "./lib/IExportObject";
import { Logger } from "./lib/Util/Logger";
import { SimplexNoise } from "./lib/Util/SimplexNoise";
import { Http } from "./lib/Util/Http";
import { ArrowActor } from "./lib/Element/Actor/ArrowActor";
import { FireCell } from "./lib/Element/Cell/FireCell";
import { WaterCell } from "./lib/Element/Cell/WaterCell";

// HTML elements
const gameCanvas = <HTMLCanvasElement>document.getElementById("game-canvas");
const addButton = <HTMLButtonElement>document.getElementById("add-button");
const messageDiv = <HTMLDivElement>document.getElementById("message-div");

// Register classes as a dependency
Exportable.Register(ArrowActor);
Exportable.Register(PlayerActor);
Exportable.Register(FireCell);
Exportable.Register(GroundCell);
Exportable.Register(StoneCell);
Exportable.Register(WaterCell);
Exportable.Register(Board);
Exportable.Register(Coord);

// Wire up listeners
addButton.onclick = () => ClickAdd();

// Tab ID
const tabId = Tools.Unique();

// Game objects
const board: Board = new Board();

// For client or server
let channel: PeerChannel = null;
let server: Server = null;

// Last shoot
let nextShoot = +new Date(0);

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
    const success = await Tools.Clipboard(text);

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
        return new Receiver(channel, board);
    }

    // Create server board, load it, create server
    try 
    {
        const rawboard = JSON.parse(await Http.Get("res/board.json"));
        const serverboard = Exportable.Import(rawboard);

        server = new Server(serverboard);

        // Use the tick of the local client on the server
        renderer.OnDraw.Add(() => serverboard.OnTick.Call());
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
    return new Receiver(localB, board);
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

    if(Keyboard.Keys[space] && nextShoot <= +new Date)
    {
        player.Shoot(Tools.Unique());
        nextShoot = +new Date + 1000;
    }
};

/**
 * Start game.
 */
const Start = async () =>
{
    Keyboard.Init();

    const renderer = new Renderer(board, gameCanvas);
    const receiver = await CreateReceiver(renderer);

    receiver.OnPlayer = async player =>
    {
        board.Origin = player.Id;

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

    const boardA: Board = new Board();
    const boardB: Board = new Board();

    // Tagging or debug purposes
    boardA["_Name"] = "boardA";
    boardB["_Name"] = "boardB";
    
    const canvasA = <HTMLCanvasElement>document.getElementById("canvasA");
    const canvasB = <HTMLCanvasElement>document.getElementById("canvasB");
    const canvasS = <HTMLCanvasElement>document.getElementById("canvasS");
    
    const rendererA = new Renderer(boardA, canvasA);
    const rendererB = new Renderer(boardB, canvasB);
    
    const channelA1 = new FakeChannel(delay);
    const channelA2 = new FakeChannel(delay);
    const channelB1 = new FakeChannel(delay);
    const channelB2 = new FakeChannel(delay);
    
    channelA1.SetOther(channelA2);
    channelA2.SetOther(channelA1);
    channelB1.SetOther(channelB2);
    channelB2.SetOther(channelB1);

    const receiverA = new Receiver(channelA1, boardA);
    const receiverB = new Receiver(channelB1, boardB);
    
    const raw: IExportObject = JSON.parse(await Http.Get("res/board.json"));
    const boardServer: Board = Exportable.Import(raw);
    const server = new Server(boardServer);
    
    server.Add(new Sender(channelA2));
    server.Add(new Sender(channelB2));
    
    receiverA.OnPlayer = async player =>
    {
        boardA.Origin = player.Id;

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
        boardB.Origin = player.Id;

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
    const rendererS = new Renderer(boardServer, canvasS);

    await rendererS.Load();

    rendererS.Start();

    // For debug
    Tools.Extract(window, {
        // Instances
        boardA,
        boardB,
        boardServer,
        // Classes
        Board,
        Tools,
        Exportable,
        Coord,
        GroundCell,
        PlayerActor,
        StoneCell,
        Logger,
        SimplexNoise
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