import { Map } from "./lib/Map";
import { Coord } from "./lib/Coord";
import { PlayerActor } from './lib/Element/Actor/PlayerActor';
import { Server } from './lib/Net/Server';
import { Renderer } from "./lib/Renderer";
import { Keyboard } from "./lib/Util/Keyboard";
import { Connection } from "./lib/Net/Connection";
import { FakeChannel } from "./lib/Net/FakeChannel";
import { Client } from "./lib/Net/Client";
import { PeerChannel } from "./lib/Net/PeerChannel";
import { Helper } from "./lib/Util/Helper";

// HTML elements
const gameCanvas = <HTMLCanvasElement>document.getElementById("game-canvas");
const addButton = <HTMLButtonElement>document.getElementById("add-button");
const messageDiv = <HTMLDivElement>document.getElementById("message-div");

// Wire up listeners
addButton.onclick = () => ClickAdd();

// Tab ID
const tabId = Helper.Unique();

// Game objects
const map: Map = new Map();

// For client or server
let clientChannel: PeerChannel = null;
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
 * Main function.
 */
const Main = async (): Promise<void> =>
{
    const hash = ReadHash();

    // If it is an offer, create an answer and wait for an open channel.
    if(hash.Type == HashType.Offer)
    {
        clientChannel = new PeerChannel();
        clientChannel.OnOpen = () => Start();

        const answer = await clientChannel.Answer(hash.Payload);
        const url = ConstructUrl({
            Tab: hash.Tab,
            Type: HashType.Answer,
            Payload: answer
        });

        await Helper.ClipboardCopy(url);

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

/**
 * Set a message on the screen.
 * @param message 
 */
const SetMessage = (message: string): void =>
{
    messageDiv.innerText = message;
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
    
    if(!await Helper.ClipboardCopy(url))
    {
        return;
    }

    SetMessage("Offer copied to clipboard!");

    channel.OnOpen = () => 
    {
        SetMessage("A new player joined!");
        server.Add(new Connection(channel));
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

        await Helper.Wait(1000);
    }
};

/**
 * Create client (and server).
 */
const CreateClient = async (): Promise<Client> =>
{
    if(clientChannel && !clientChannel.IsOfferor())
    {
        return new Client(clientChannel, map);
    }

    // Show add button
    addButton.style.display = "block";

    // Create server map, load it, create server
    const serverMap: Map = new Map();

    await serverMap.Load("res/map.json");

    server = new Server(serverMap);

    // Create a fake channel
    const localA = new FakeChannel();
    const localB = new FakeChannel();

    localA.SetOther(localB);
    localB.SetOther(localA);

    // Add connection to the server
    server.Add(new Connection(localA));

    // Connect client to the server
    return new Client(localB, map);
}

/**
 * Game cycle
 * @param player 
 * @param up
 * @param left
 * @param down
 * @param right
 */
const OnUpdate = (player: PlayerActor, { up, left, down, right }) =>
{
    const direction = new Coord(
        Keyboard.Keys[left] ? -0.05 : Keyboard.Keys[right] ? 0.05 : 0, 
        Keyboard.Keys[up] ? -0.05 : Keyboard.Keys[down] ? 0.05 : 0
    );

    if(player && direction.GetDistance(new Coord) > 0)
    {
        player.Move(direction);
    }
};

/**
 * Start game.
 */
const Start = async () =>
{
    Keyboard.Init();

    const client = await CreateClient();
    const renderer = new Renderer(map, gameCanvas);

    client.OnPlayer = async player =>
    {
        await renderer.Load();
        
        const keys = 
        {
            up: "ARROWUP", 
            left: "ARROWLEFT", 
            down: "ARROWDOWN", 
            right: "ARROWRIGHT"
        };

        renderer.OnUpdate.Add(() => OnUpdate(player, keys));
        renderer.Start();
    };
};

// Start the main function
Main();