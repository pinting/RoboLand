import { Map } from "../Map";
import { PlayerActor } from "../Element/Actor/PlayerActor";
import { Sender } from "./Sender";
import { Exportable } from "../Exportable";
import { IExportObject } from "../IExportObject";
import { Coord } from "../Coord";
import { Tools } from "../Util/Tools";

export class Server
{
    private readonly map: Map;
    private readonly clients: Sender[] = [];

    /**
     * Construct a new server with the given map. The server gonna
     * update each clientections (clients) with the map and sync every
     * move of the clients between them.
     * @param map 
     */
    public constructor(map: Map)
    {
        this.map = map;

        // Update elements for clientections except their own player
        this.map.OnUpdate.Add(element => this.clients
            .forEach(client => client.SendElement(element)));
    }

    /**
     * Executed when the server receives a new message from a client/clientection.
     * @param client
     * @param command
     */
    private OnCommand(client: Sender, command: IExportObject)
    {
        const args = Exportable.Import(command);
        const player = client.Player;

        Map.Current = this.map;

        if(!args.length && player.Id == args[0])
        {
            this.Kick(client);
            return;
        }

        // Execute command on the player
        player[args[1]].bind(player)(...args.slice(2));

        // Send the command to the other players
        this.clients
            .filter(client => player.Origin != client.Player.Origin)
            .forEach(client => client.SendCommand(args));
    }

    /**
     * Kick client out of the server.
     * @param client 
     */
    private Kick(client: Sender)
    {
        const index = this.clients.indexOf(client);

        if(index >= 0)
        {
            this.clients.splice(index, 1);
            this.map.Actors.Remove(client.Player);
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
        // Create player and add it to the map
        Map.Current = this.map;

        const playerTag = Tools.Unique();
        const player = new PlayerActor({
            id: playerTag,
            origin: playerTag,
            position: new Coord(0, 0),
            size: new Coord(0.8, 0.8),
            direction: new Coord(0, 0),
            texture: "res/player.png",
            speed: 0.05,
            damage: 0.1,
            health: 1.0
        });

        this.map.Actors.Set(player);

        // Set size
        await client.SendSize(this.map.Size);

        // Set cells
        for(let cell of this.map.Cells.List)
        {
            await client.SendElement(cell);
        }

        // Set actors
        for(let actor of this.map.Actors.List)
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