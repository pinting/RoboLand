import { World } from "../World";
import { PlayerActor } from "../Unit/Actor/PlayerActor";
import { Host } from "./Host";
import { Exportable, ExportType } from "../Exportable";
import { Tools } from "../Util/Tools";
import { BaseActor } from "../Unit/Actor/BaseActor";
import { Body } from "../Physics/Body";
import { Logger } from "../Util/Logger";
import { Dump } from "../Dump";
import { ResourceManager } from "../Util/ResourceManager";

export class Server
{
    public static SpawnZ = 0;

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
            .filter(c => !c.IsBlocking() && c.GetBody().GetZ() == Server.SpawnZ)
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
    private OnCommand(host: Host, command: Dump)
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
    // TODO: Refactor this to use RoboPack
    public async Add(host: Host)
    {
        // Create player and add it to the world
        World.Current = this.world;

        const playerTag = Tools.Unique();
        const basePlayer = this.world.GetBasePlayer();

        let actors: BaseActor[] = [];
        let player: PlayerActor;

        for(let spawn of this.spawns)
        {
            actors = this.world.GetActors().GetArray().filter(u => u.GetBody().Collide(spawn));

            if(actors.length)
            {
                continue;
            }

            player = basePlayer.Clone() as PlayerActor;

            player.GetBody().Init({
                z: spawn.GetZ(),
                position: spawn.GetPosition()
            });

            player.Init({
                id: playerTag,
                parent: playerTag,
                ignore: false // IMPORTANT, to set this to ignore
            });

            this.world.Set(player);

            break;
        }

        if(actors.length)
        {
            throw new Error("Not enough space for new player!");
        }

        this.world.GetActors().Set(player);

        // Send resources
        await host.SendResources(await ResourceManager.GetBuffer());

        // Send world
        await host.SendWorld(Exportable.Export(this.world, null, ExportType.Net));
        
        // Subscribe to the OnCommand callback
        host.OnCommand = command => this.OnCommand(host, command);
        
        // Set player
        await host.SendPlayer(player);

        // Add host to the internal host list
        this.hosts.push(host);
    }
}