import { World } from "../World";
import { PlayerActor } from "../Unit/Actor/PlayerActor";
import { Host } from "./Host";
import { Exportable } from "../Exportable";
import { IDump } from "../IDump";
import { Vector } from "../Geometry/Vector";
import { Tools } from "../Util/Tools";
import { NormalCell } from "../Unit/Cell/NormalCell";
import { BaseCell } from "../Unit/Cell/BaseCell";
import { BaseActor } from "../Unit/Actor/BaseActor";
import { Body } from "../Physics/Body";
import { Unit } from "../Unit/Unit";
import { ArrowActor } from "../Unit/Actor/ArrowActor";
import { Logger } from "../Util/Logger";

export class Server
{
    private readonly world: World;
    private readonly spawns: Body[];
    private readonly hosts: Host[] = [];

    /**
     * Construct a new server with the given world. The server gonna
     * update each client with the world and sync every
     * move of the clients between them.
     * @param world 
     */
    public constructor(world: World)
    {
        this.world = world;

        this.spawns = this.world.GetCells().GetArray()
            .filter(c => c instanceof NormalCell)
            .sort((a, b) => Tools.Random(-100, 100))
            .map(c => c.GetBody());
        
        this.world.OnUpdate.Add(unit => this.hosts
            .forEach(host => host.SendUnit(unit)));
    }

    /**
     * Executed when the server receives a new message from a client.
     * @param host
     * @param command
     */
    private OnCommand(host: Host, command: IDump)
    {
        const args = Exportable.Import(command);
        const player = host.GetPlayer();

        World.Current = this.world;

        if(!args.length && player.GetId() == args[0])
        {
            this.Kick(host);
            return;
        }

        try {
            // Execute command on the player
            player[args[1]].bind(player)(...args.slice(2));

            // Send the command to the other players
            this.hosts
                .filter(host => player.GetParent() != host.GetPlayer().GetParent())
                .forEach(host => host.SendCommand(args));
        }
        catch(e) {
            // Kick if we receive an exception
            host.SendKick();
            Logger.Warn(this, e);
        }
    }

    /**
     * Kick client out of the server.
     * @param host 
     */
    public Kick(host: Host)
    {
        const index = this.hosts.indexOf(host);

        if(index >= 0)
        {
            this.hosts.splice(index, 1);
            this.world.GetActors().Remove(host.GetPlayer());
            host.SendKick();
        }
    }

    /**
     * Add a new client to the server. The host represents
     * the client on the server side - it only communicates
     * with a Client object through an IChannel implementation.
     * @param host 
     */
    public async Add(host: Host)
    {
        // Create player and add it to the world
        World.Current = this.world;

        const playerTag = Tools.Unique();
        const player = new PlayerActor;

        let actors: BaseActor[];

        for(let spawn of this.spawns)
        {
            actors = this.world.GetActors().GetArray().filter(u => u.GetBody().Collide(spawn));

            if(actors.length)
            {
                continue;
            }

            const body = Body.CreateBoxBody(
                new Vector(1, 1), 
                0, 
                spawn.GetOffset(), 
                { z: spawn.GetZ() });
            
            const arrow = new ArrowActor();

            arrow.Init({
                ignore: true,
                body: Body.CreateBoxBody(new Vector(0.1, 0.1), 0, new Vector(0, 0))
            });

            player.Init({
                id: playerTag,
                parent: playerTag,
                body: body,
                texture: "res/player.png",
                speed: 1500,
                health: 1,
                rotSpeed: 200,
                light: 6,
                arrow: arrow
            });

            break;
        }

        if(actors.length)
        {
            throw new Error("Not enough space for new player!");
        }

        this.world.GetActors().Set(player);

        // Set size
        await host.SendSize(this.world.GetSize());

        // Set cells
        for(let cell of this.world.GetCells().GetArray())
        {
            await host.SendUnit(cell);
        }

        // Set actors
        for(let actor of this.world.GetActors().GetArray())
        {
            await host.SendUnit(actor);
        }
        
        // Subscribe to the OnCommand callback
        host.OnCommand = command => this.OnCommand(host, command);
        
        // Set player
        await host.SendPlayer(player);

        // Add host to the internal host list
        this.hosts.push(host);
    }
}