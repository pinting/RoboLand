import { IChannel } from "./Channel/IChannel";
import { MessageType } from "./MessageType";
import { World } from "../World";
import { Exportable } from "../Exportable";
import { PlayerActor } from "../Unit/Actor/PlayerActor";
import { Tools } from "../Util/Tools";
import { IMessage } from "./IMessage";
import { MessageHandler } from "./MessageHandler";
import { Logger } from "../Util/Logger";
import { Unit } from "../Unit/Unit";
import { Host } from "./Host";
import { Dump } from "../Dump";

const MAX_POS_DIFF = 0.5;
const MAX_ROT_DIFF = Math.PI / 4;
const PLAYER_SYNCED_FUNCTIONS = ["Damage", "Shoot", "StopRot", "StartRot", "StartWalk", "StopWalk"];

export class Client extends MessageHandler
{
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
            this.last[unit.GetId()] = Exportable.Export(unit));
    }

    /**
     * Receive a Message through the channel.
     * @param message 
     */
    protected OnMessage(message: IMessage): void
    {
        Logger.Info(this, "Message was received", message);

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
            case MessageType.Size:
                this.ReceiveSize(message.Payload);
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
        this.world.Add(unit);

        // Add to network cache
        this.last[unit.GetId()] = dump;
    }

    /**
     * Receive an diff of an unit.
     * @param diff
     */
    private async ReceiveDiff(diff: Dump): Promise<void>
    {
        Logger.Info(this, "Diff was received!", diff);

        // Hack out ID from the dump
        const id = diff && diff.Payload && diff.Payload.length && 
            diff.Payload.find((prop: Dump) => prop.Name == "id").Payload;

        if(!id)
        {
            Logger.Warn(this, "No ID for diff!");
            return;
        }

        // Check if we already have it
        const oldUnit = this.world.GetUnits().Get(id);

        // Return if we do not have an older version,
        // because we cannot receive a diff without a base
        if(!oldUnit)
        {
            Logger.Warn(this, "Received diff, but no base unit!");
            return;
        }

        World.Current = this.world;

        // If we have an older version, merge it
        const merged = Exportable.Export(oldUnit);

        Dump.Merge(merged, diff);

        let newUnit: Unit;

        try 
        {
            newUnit = Exportable.Import(merged);
        }
        catch
        {
            return;
        }

        const newBody = newUnit.GetBody();
        const oldBody = oldUnit.GetBody();

        // If the position or the rotation difference is under a limit, skip updating
        if(Dump.IsMovementDiff(diff) && oldBody.GetPosition())
        {
            const posDiff = newBody.GetPosition().Dist(oldBody.GetPosition());
            const rotDiff = Math.abs(newBody.GetRotation() - oldBody.GetRotation());

            if(posDiff < MAX_POS_DIFF && rotDiff < MAX_ROT_DIFF)
            {
                Logger.Info(this, "Unit was optimized out", newUnit);
                return;
            }
        }

        return this.ReceiveUnit(merged);
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
            if(!PLAYER_SYNCED_FUNCTIONS.includes(prop))
            {
                return;
            }

            const dump = Exportable.Export([player.GetId(), prop].concat(args));

            this.SendMessage(MessageType.Command, dump);
        }));
    }

    /**
     * Receive the size of the world.
     * @param size 
     */
    private ReceiveSize(dump: Dump): void
    {
        this.world.Init(Exportable.Import(dump));
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
        this.last[player.GetId()] = Exportable.Export(player);
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