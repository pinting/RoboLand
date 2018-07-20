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
            .filter(conn => element.GetTag() != conn.GetPlayer().GetTag())
            .forEach(conn => conn.SetElement(element)));
    }

    /**
     * Executed when receive a new message from a client.
     * @param conn 
     * @param player 
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
     * Add a new client to the server.
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