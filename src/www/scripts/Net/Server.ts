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
     * Construct a new server with the given map. The server gonna
     * update each connections (clients) with the map and sync every
     * move of the clients between them.
     * @param map 
     */
    public constructor(map: Map)
    {
        this.map = map;

        // Update elements for connections except their own player
        this.map.OnUpdate.Add(element => this.conns
            .filter(conn => element.GetTag() != conn.GetPlayer().GetTag())
            .forEach(conn => conn.SetElement(element)));
    }

    /**
     * Executed when the server receives a new message from a client/connection.
     * @param conn
     * @param command
     */
    private OnCommand(conn: Connection, command: IExportObject)
    {
        const args = Exportable.Import(command);

        if(!args.length)
        {
            this.Kick(conn);
            return;
        }

        const player = conn.GetPlayer();

        // Execute command on the player
        player[args[0]].bind(player)(...args.slice(1));
    }

    /**
     * Kick client out of the server.
     * @param conn 
     */
    private Kick(conn: Connection)
    {
        const index = this.conns.indexOf(conn);

        if(index >= 0)
        {
            this.conns.splice(index, 1);
            this.map.GetActors().Remove(conn.GetPlayer());
            conn.Kick();
        }
    }

    /**
     * Add a new connection/client to the server. This represents
     * the client on the server side - it only communicates
     * with a Client object through an IChannel implementation.
     * @param conn 
     */
    public async Add(conn: Connection)
    {
        // Create player and add it to the map
        const player = new PlayerActor(new Coord(0, 0), this.map);

        this.map.GetActors().Set(player);

        // Set size
        await conn.SetSize(this.map.GetSize());

        // Set actors
        for(let actor of this.map.GetActors().List())
        {
            await conn.SetElement(actor);
        }

        // Set cells
        for(let cell of this.map.GetCells().List())
        {
            await conn.SetElement(cell);
        }
        
        // Subscribe to the OnCommand callback
        conn.OnCommand = command => this.OnCommand(conn, command);
        
        // Set player
        await conn.SetPlayer(player);

        // Add client to the internal client list
        this.conns.push(conn);
    }
}