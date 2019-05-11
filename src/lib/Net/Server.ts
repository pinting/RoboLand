import { Board } from "../Board";
import { PlayerActor } from "../Element/Actor/PlayerActor";
import { Sender } from "./Sender";
import { Exportable } from "../Exportable";
import { IDump } from "../IDump";
import { Vector } from "../Geometry/Vector";
import { Tools } from "../Util/Tools";
import { GroundCell } from "../Element/Cell/GroundCell";
import { BaseCell } from "../Element/Cell/BaseCell";
import { BaseActor } from "../Element/Actor/BaseActor";

export class Server
{
    private readonly board: Board;
    private readonly spawns: BaseCell[];
    private readonly clients: Sender[] = [];

    /**
     * Construct a new server with the given board. The server gonna
     * update each client with the board and sync every
     * move of the clients between them.
     * @param board 
     */
    public constructor(board: Board)
    {
        this.board = board;

        this.spawns = this.board.GetCells().GetList()
            .filter(c => c instanceof GroundCell)
            .sort((a, b) => Tools.Random(-100, 100));
        
        this.board.OnUpdate.Add(element => this.clients
            .forEach(client => client.SendElement(element)));
    }

    /**
     * Executed when the server receives a new message from a client/clientection.
     * @param client
     * @param command
     */
    private OnCommand(client: Sender, command: IDump)
    {
        const args = Exportable.Import(command);
        const player = client.GetPlayer();

        Board.Current = this.board;

        if(!args.length && player.GetId() == args[0])
        {
            this.Kick(client);
            return;
        }

        try {
            // Execute command on the player
            player[args[1]].bind(player)(...args.slice(2));

            // Send the command to the other players
            this.clients
                .filter(client => player.GetOrigin() != client.GetPlayer().GetOrigin())
                .forEach(client => client.SendCommand(args));
        }
        catch {
            // Kick if we receive an exception
            client.SendKick();
        }
    }

    /**
     * Kick client out of the server.
     * @param client 
     */
    public Kick(client: Sender)
    {
        const index = this.clients.indexOf(client);

        if(index >= 0)
        {
            this.clients.splice(index, 1);
            this.board.GetActors().Remove(client.GetPlayer());
            client.SendKick();
        }
    }

    /**
     * Add a new clientection/client to the server. This represents
     * the client on the server side - it only communicates
     * with a Client object through an IChannel implementation.
     * @param client 
     */
    public async Add(client: Sender)
    {
        // Create player and add it to the board
        Board.Current = this.board;

        const playerTag = Tools.Unique();
        const player = new PlayerActor;
        let actors: BaseActor[];

        for(let spawn of this.spawns)
        {
            actors = this.board.GetActors().FindCollisions(spawn);

            if(actors.length)
            {
                continue;
            }

            player.Init({
                id: playerTag,
                origin: playerTag,
                position: spawn.GetPosition(),
                size: new Vector(1, 1),
                angle: 0,
                texture: "res/player.png",
                speed: 0.05,
                damage: 0.1,
                health: 1.0
            });

            break;
        }

        if(actors.length)
        {
            throw new Error("Not enough space for new player!");
        }

        this.board.GetActors().Set(player);

        // Set size
        await client.SendSize(this.board.GetSize());

        // Set cells
        for(let cell of this.board.GetCells().GetList())
        {
            await client.SendElement(cell);
        }

        // Set actors
        for(let actor of this.board.GetActors().GetList())
        {
            await client.SendElement(actor);
        }
        
        // Subscribe to the OnCommand callback
        client.OnCommand = command => this.OnCommand(client, command);
        
        // Set player
        await client.SendPlayer(player);

        // Add client to the internal client list
        this.clients.push(client);
    }
}