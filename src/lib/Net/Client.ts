import { IChannel } from "./Channel/IChannel";
import { MessageType } from "./MessageType";
import { World } from "../World";
import { Exportable } from "../Exportable";
import { BaseCell } from "../Unit/Cell/BaseCell";
import { BaseActor } from "../Unit/Actor/BaseActor";
import { PlayerActor } from "../Unit/Actor/PlayerActor";
import { Tools } from "../Util/Tools";
import { IDump } from "../IDump";
import { IMessage } from "./IMessage";
import { MessageHandler } from "./MessageHandler";
import { Logger } from "../Util/Logger";
import { Unit } from "../Unit/Unit";
import { Host } from "./Host";

const MAX_POS_DIFF = 0.5;
const MAX_ROT_DIFF = Math.PI / 4;
const PLAYER_SYNCED_FUNCTIONS = ["Damage", "Shoot", "StopRot", "StartRot", "StartWalk", "StopWalk"];

export class Client extends MessageHandler
{
    private world: World;
    private player: PlayerActor;
    private last: { [id: string]: IDump } = {};

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
            case MessageType.Element:
                this.ReceiveElement(message.Payload);
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
    private async ReceiveElement(dump: IDump): Promise<void>
    {   
        World.Current = this.world;

        const unit: Unit = Exportable.Import(dump);

        Logger.Info(this, "Element was received!", unit, dump);

        // Add unit to the world
        this.world.Add(unit);

        // Add to network cache
        this.last[unit.GetId()] = dump;
    }

    /**
     * Receive an diff of an unit.
     * @param diff
     */
    private async ReceiveDiff(diff: IDump): Promise<void>
    {
        Logger.Info(this, "Diff was received!", diff);

        // Hack out ID from the dump
        const id = diff && diff.Payload && diff.Payload.length && 
            diff.Payload.find((prop: IDump) => prop.Name == "id").Payload;

        if(!id)
        {
            Logger.Warn(this, "No ID for diff!");
            return;
        }

        // Check if we already have it
        const oldElement = this.world.GetUnits().Get(id);

        // Return if we do not have an older version,
        // because we cannot receive a diff without a base
        if(!oldElement)
        {
            Logger.Warn(this, "Received diff, but no base unit!");
            return;
        }

        World.Current = this.world;

        // If we have an older version, merge it
        const merged = Exportable.Export(oldElement);

        Exportable.Merge(merged, diff);

        let newElement: Unit;

        try 
        {
            newElement = Exportable.Import(merged);
        }
        catch
        {
            return;
        }

        const newBody = newElement.GetBody();
        const oldBody = oldElement.GetBody();

        // If the position or the rotation difference is under a limit, skip updating
        if(Exportable.IsMovementDiff(diff) && oldBody.GetOffset())
        {
            const posDiff = newBody.GetOffset().Dist(oldBody.GetOffset());
            const rotDiff = Math.abs(newBody.GetRotation() - oldBody.GetRotation());

            if(posDiff < MAX_POS_DIFF && rotDiff < MAX_ROT_DIFF)
            {
                Logger.Info(this, "Element was optimized out", newElement);
                return;
            }
        }

        return this.ReceiveElement(merged);
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
    private ReceiveSize(dump: IDump): void
    {
        this.world.Init(Exportable.Import(dump));
    }

    /**
     * Receive a command from another player.
     * @param command 
     */
    private ReceiveCommand(command: IDump): void
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
        Logger.Warn("Kicked from the server!");
        this.channel.Close();
    }

    /**
     * Executed when the player is set.
     */
    public OnPlayer: (player: PlayerActor) => void = Tools.Noop;
}