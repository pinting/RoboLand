import { Map } from "../Map";
import { BaseElement } from "../Element/BaseElement";
import { PlayerActor } from "../Element/Actor/PlayerActor";
import { ServerClient } from "./ServerClient";

export class Server
{
    private readonly map: Map;
    private readonly clients: ServerClient[] = [];

    /**
     * Construct a new server.
     */
    public constructor(map: Map)
    {
        this.map = map;
        this.map.OnUpdate = element => this.SetElement(element);
    }

    /**
     * Executed when receive a new message from a client.
     * @param client 
     * @param player 
     * @param args
     */
    private OnCommand(client: ServerClient, args: any[])
    {
        if(!args.length)
        {
            this.Kick(client);
            return;
        }

        client.GetPlayer()[args[0]](...args.slice(1));
    }

    /**
     * Kick client out of the server.
     * @param client 
     */
    private Kick(client: ServerClient)
    {
        const index = this.clients.indexOf(client);

        if(index >= 0)
        {
            this.clients.splice(index, 1);
            this.map.GetActors().Remove(client.GetPlayer());
            client.Kick();
        }
    }

    /**
     * Send an element to everybody (or everybody except one client).
     * @param element 
     */
    private SetElement(element: BaseElement, exception: ServerClient = null)
    {
        this.clients
            .filter(client => client != exception)
            .forEach(client => client.SetElement(element));
    }
    
    /**
     * Add a new client to the server.
     * @param client 
     */
    public async Add(client: ServerClient)
    {
        // Create player and add it to the map
        const player = new PlayerActor();

        this.map.GetActors().Set(player);

        // Set size
        await client.SetSize(this.map.GetSize());

        // Set actors
        for(let actor of this.map.GetCells().List())
        {
            await client.SetElement(actor);
        }

        // Set cells
        for(let cell of this.map.GetCells().List())
        {
            await client.SetElement(cell);
        }
        
        // Subscribe to the OnCommand callback
        client.OnCommand = args => this.OnCommand(client, args);
        
        // Set player
        await client.SetPlayer(player);
    }
}