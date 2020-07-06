import { IChannel } from "./Channel/IChannel";
import { MessageType } from "./MessageType";
import { World } from "../World";
import { Exportable, ExportType } from "../Exportable";
import { PlayerActor } from "../Unit/Actor/PlayerActor";
import { Tools } from "../Util/Tools";
import { IMessage } from "./IMessage";
import { MessageHandler } from "./MessageHandler";
import { Logger } from "../Util/Logger";
import { Unit } from "../Unit/Unit";
import { Dump } from "../Dump";
import { ResourceManager } from "../Util/ResourceManager";
import { Body } from "../Physics/Body";

export class Client extends MessageHandler
{
    public static DisableOptimization = false;
    public static PlayerSyncedFunctions = [
        "Damage",
        "Shoot",
        "StopRot",
        "StartRot",
        "StartWalk",
        "StopWalk"
    ]

    private world: World;
    private player: PlayerActor;
    private last: { [id: string]: Dump } = {};

    /**
     * Construct a new client which communicates with a connection.
     * @param channel 
     */
    constructor(channel: IChannel, world: World)
    {
        super(channel);
        
        this.world = world;

        // Add updated unit to network cache
        this.world.OnUpdate.Add(unit => 
            this.last[unit.GetId()] = Exportable.Export(unit, null, ExportType.Net));
    }

    /**
     * Receive a message through the channel.
     * @param message 
     */
    protected OnMessage(message: IMessage, buffer: ArrayBuffer): void
    {
        Logger.Debug(this, "Message was received", message);

        World.Current = this.world;

        switch(message.Type)
        {
            case MessageType.Unit:
                this.ReceiveUnit(message.Payload);
                break;
            case MessageType.Diff:
                this.ReceiveDiff(message.Payload);
                break;
            case MessageType.Player:
                this.ReceivePlayer(message.Payload);
                break;
            case MessageType.World:
                this.ReceiveWorld(buffer);
                break;
            case MessageType.Resources:
                this.ReceiveResources(buffer);
                break;
            case MessageType.Command:
                this.ReceiveCommand(message.Payload);
                break;
            case MessageType.Kick:
                this.ReceiveKick();
                break;
            default:
                // Invalid
                break;
        }
    }
  
    /**
     * Receive an unit.
     * @param dump
     */
    private async ReceiveUnit(dump: Dump): Promise<void>
    {   
        World.Current = this.world;

        const unit: Unit = Exportable.Import(dump);

        Logger.Info(this, "Unit was received!", unit, dump);

        // Add unit to the world
        this.world.Set(unit);

        // Add to network cache
        this.last[unit.GetId()] = dump;
    }

    /**
     * Receive an diff of an unit.
     * @param diff
     */
    private async ReceiveDiff(diff: Dump): Promise<void>
    {
        Logger.Debug(this, "Diff was received!", diff);

        // Hack out ID from the dump
        const id = diff && diff.Payload && diff.Payload.length && 
            diff.Payload.find((prop: Dump) => prop.Name == "id").Payload;

        if(!id)
        {
            Logger.Warn(this, "No ID for diff, cannot proceed!");
            return;
        }

        // Check if we already have it
        const oldUnit = this.world.GetUnits().Get(id);

        // We cannot receive a diff without a base
        if(!oldUnit)
        {
            Logger.Warn(this, "Received diff, but no base unit!");
            return;
        }

        World.Current = this.world;

        // If we have an older version, merge it
        const oldDump = Exportable.Export(oldUnit, null, ExportType.Net);

        Dump.Merge(oldDump, diff);

        if(!Client.DisableOptimization && Dump.TestDump(diff, ["id", "body"]))
        {
            const newUnit = Exportable.Import(oldDump) as Unit;
            const newBody = newUnit.GetBody();
            const oldBody = oldUnit.GetBody();
    
            // If only a positional difference is present which is under a limit, skip updating
            if(Body.Equal(newBody, oldBody))
            {
                Logger.Debug(this, "Unit was optimized out", newUnit);
                return;
            }
        }

        return this.ReceiveUnit(oldDump);
    }

    /**
     * Receive resources.
     * @param buffer 
     */
    private ReceiveResources(buffer: ArrayBuffer)
    {
        ResourceManager.Load(buffer);
    }

    /**
     * Receive the world.
     * @param size 
     */
    private ReceiveWorld(buffer: ArrayBuffer): void
    {
        const charArray = Tools.ZLibInflate(buffer);
        const dump = JSON.parse(Tools.ANSIToUTF16(charArray));

        Tools.Extract(this.world, Exportable.Import(dump));
    }

    /**
     * Receive the player by id.
     * @param id 
     */
    private ReceivePlayer(id: string): void
    {
        const player = this.player = <PlayerActor>this.world.GetActors().Get(id);

        this.OnPlayer(Tools.Hook(player, (target, prop, args) => 
        {
            if(!Client.PlayerSyncedFunctions.includes(prop))
            {
                return;
            }

            const dump = Exportable.Export([player.GetId(), prop].concat(args));

            this.SendMessage(MessageType.Command, dump);
        }));
    }

    /**
     * Receive a command from another player.
     * @param command 
     */
    private ReceiveCommand(command: Dump): void
    {
        if(!this.player)
        {
            return;
        }

        const args: any[] = Exportable.Import(command);

        if(args.length < 2)
        {
            return;
        }

        const player = <PlayerActor>this.world.GetActors().Get(args[0]);
        
        World.Current = this.world;

        // Execute command on the player
        player[args[1]].bind(player)(...args.slice(2));

        // Add to network cache
        this.last[player.GetId()] = Exportable.Export(player, null, ExportType.Net);
    }

    /**
     * Kick this client of the server.
     */
    private ReceiveKick(): void
    {
        Logger.Warn(this, "Kicked from the server!");
        this.channel.Close();
    }

    /**
     * Executed when the player is set.
     */
    public OnPlayer: (player: PlayerActor) => void = Tools.Noop;
}