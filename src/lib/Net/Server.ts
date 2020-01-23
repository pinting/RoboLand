import { World } from "../World";
import { PlayerActor } from "../Unit/Actor/PlayerActor";
import { Host } from "./Host";
import { Exportable } from "../Exportable";
import { IDump } from "../IDump";
import { Vector } from "../Geometry/Vector";
import { Tools } from "../Util/Tools";
import { GroundCell } from "../Unit/Cell/GroundCell";
import { BaseCell } from "../Unit/Cell/BaseCell";
import { BaseActor } from "../Unit/Actor/BaseActor";

export class Server
{
    private readonly world: World;
    private readonly spawns: BaseCell[];
    private readonly clients: Host[] = [];

    /**
     * Construct a new server with the given world. The server gonna
     * update each client with the world and sync every
     * move of the clients between them.
     * @param world 
     */
    public constructor(world: World)
    {
        this.world = world;

        this.spawns = this.world.GetCells().GetList()
            .filter(c => c instanceof GroundCell)
            .sort((a, b) => Tools.Random(-100, 100));
        
        this.world.OnUpdate.Add(unit => this.clients
            .forEach(client => client.SendElement(unit)));
    }

    /**
     * Executed when the server receives a new message from a client/clientection.
     * @param client
     * @param command
     */
    private OnCommand(client: Host, command: IDump)
    {
        const args = Exportable.Import(command);
        const player = client.GetPlayer();

        World.Current = this.world;

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
                .filter(client => player.GetParent() != client.GetPlayer().GetParent())
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
    public Kick(client: Host)
    {
        const index = this.clients.indexOf(client);

        if(index >= 0)
        {
            this.clients.splice(index, 1);
            this.world.GetActors().Remove(client.GetPlayer());
            client.SendKick();
        }
    }

    /**
     * Add a new clientection/client to the server. This represents
     * the client on the server side - it only communicates
     * with a Client object through an IChannel implementation.
     * @param client 
     */
    public async Add(client: Host)
    {
        // Create player and add it to the world
        World.Current = this.world;

        const playerTag = Tools.Unique();
        const player = new PlayerActor;
        let actors: BaseActor[];

        for(let spawn of this.spawns)
        {
            actors = this.world.GetActors().FindCollisions(spawn);

            if(actors.length)
            {
                continue;
            }

            player.Init({
                id: playerTag,
                parent: playerTag,
                position: spawn.GetPosition(),
                size: new Vector(1, 1),
                angle: 0,
                texture: "res/player.png",
                speed: 1500,
                damage: 0.1,
                health: 1,
                rotSpeed: 200
            });

            break;
        }

        if(actors.length)
        {
            throw new Error("Not enough space for new player!");
        }

        this.world.GetActors().Set(player);

        // Set size
        await client.SendSize(this.world.GetSize());

        // Set cells
        for(let cell of this.world.GetCells().GetList())
        {
            await client.SendElement(cell);
        }

        // Set actors
        for(let actor of this.world.GetActors().GetList())
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