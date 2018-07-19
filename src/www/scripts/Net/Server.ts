import { Map } from "../Map";
import { BaseElement } from "../Element/BaseElement";
import { PlayerActor } from "../Element/Actor/PlayerActor";
import { Connection } from "./Connection";
import { Exportable } from "../Exportable";
import { IExportObject } from "../IExportObject";
import { Coord } from "../Coord";

export class Server
{
    private readonly map: Map;
    private readonly conns: Connection[] = [];

    /**
     * Construct a new server.
     */
    public constructor(map: Map)
    {
        this.map = map;

        // Update elements for clients except their own player
        this.map.OnUpdate.Add(element => this.conns
            .filter(client => element.GetTag() != client.GetPlayer().GetTag())
            .forEach(client => client.SetElement(element)));
    }

    /**
     * Executed when receive a new message from a client.
     * @param client 
     * @param player 
     * @param command
     */
    private OnCommand(client: Connection, command: IExportObject)
    {
        const args = Exportable.Import(command);

        if(!args.length)
        {
            this.Kick(client);
            return;
        }

        const player = client.GetPlayer();

        player[args[0]].bind(player)(...args.slice(1));
    }

    /**
     * Kick client out of the server.
     * @param client 
     */
    private Kick(client: Connection)
    {
        const index = this.conns.indexOf(client);

        if(index >= 0)
        {
            this.conns.splice(index, 1);
            this.map.GetActors().Remove(client.GetPlayer());
            client.Kick();
        }
    }

    /**
     * Add a new client to the server.
     * @param client 
     */
    public async Add(client: Connection)
    {
        // Create player and add it to the map
        const player = new PlayerActor(new Coord(0, 0), this.map);

        this.map.GetActors().Set(player);

        // Set size
        await client.SetSize(this.map.GetSize());

        // Set actors
        for(let actor of this.map.GetActors().List())
        {
            await client.SetElement(actor);
        }

        // Set cells
        for(let cell of this.map.GetCells().List())
        {
            await client.SetElement(cell);
        }
        
        // Subscribe to the OnCommand callback
        client.OnCommand = command => this.OnCommand(client, command);
        
        // Set player
        await client.SetPlayer(player);

        // Add client to the internal client list
        this.conns.push(client);
    }
}