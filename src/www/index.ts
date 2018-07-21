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

// HTML elements
const gameCanvas = <HTMLCanvasElement>document.getElementById("game-canvas");
const offerInput = <HTMLInputElement>document.getElementById("offer-input");
const answerInput = <HTMLInputElement>document.getElementById("answer-input");
const offerButton = <HTMLButtonElement>document.getElementById("offer-button");
const answerButton = <HTMLButtonElement>document.getElementById("answer-button");
const finishButton = <HTMLButtonElement>document.getElementById("finish-button");

// Game objects
const channel = new PeerChannel();
const map: Map = new Map();

let server: Server;

/**
 * Create an offer.
 */
const ClickOffer = async (): Promise<void> =>
{
    offerInput.value = await channel.Offer();
};

/**
 * Create an answer from the pasted offer.
 */
const ClickAnswer = async (): Promise<void> => 
{
    const offer = offerInput.value;

    if(offer && offer.length > 10)
    {
        answerInput.value = await channel.Answer(offer);
    }
};

/**
 * Finish negotiation with the pasted answer.
 */
const ClickFinish = (): void =>
{
    const answer = answerInput.value;

    if(answer && answer.length > 10)
    {
        channel.Finish(answer);
    }
};

/**
 * Create client (and server).
 */
const CreateClient = async (): Promise<Client> =>
{
    if(!channel.IsOfferor())
    {
        return new Client(channel, map);
    }

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
    server.Add(new Connection(channel));
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
    if(!channel.IsOpen())
    {
        return;
    }

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

// Wire up listeners
offerButton.onclick = () => ClickOffer();
answerButton.onclick = () => ClickAnswer();
finishButton.onclick = () => ClickFinish();
channel.OnOpen = () => Start();