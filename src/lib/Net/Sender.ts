import { Tools } from "../Util/Tools";
import { IChannel } from "./Channel/IChannel";
import { PlayerActor } from "../Element/Actor/PlayerActor";
import { Exportable } from "../Exportable";
import { MessageType } from "./MessageType";
import { Vector } from "../Geometry/Vector";
import { Unit } from "../Element/Unit";
import { IDump } from "../IDump";
import { IMessage } from "./IMessage";
import { MessageHandler } from "./MessageHandler";
import { Server } from "./Server";
import { Logger } from "../Util/Logger";

const SLEEP_TIME = 1000;

export class Sender extends MessageHandler
{
    private server: Server;
    private player: PlayerActor;
    private last: { [id: string]: IDump } = {};
    private lastTime: { [id: string]: number } = {};
    
    /**
     * Construct a new connection which communicates with a client.
     * @param channel Direct channel to the client.
     */
    constructor(channel: IChannel, server: Server)
    {
        super(channel);

        this.server = server;
    }
    
    /**
     * Get the previously setted player actor.
     */
    public GetPlayer(): PlayerActor
    {
        return this.player;
    }

    /**
     * Receive a Message through the channel and parse it.
     * @param message 
     */
    protected OnMessage(message: IMessage): void
    {
        switch(message.Type)
        {
            case MessageType.Command:
                this.OnCommand(message.Payload);
                break;
            default:
                // Kick after any sort of manipulation
                this.SendKick();
                break;
        }
    }

    /**
     * Init world. Also deletes previously setted elements.
     * @param size 
     */
    public async SendSize(size: Vector): Promise<void>
    {
        return this.SendMessage(MessageType.Size, Exportable.Export(size));
    }

    /**
     * Return true if only the position or the angle is different.
     * @param diff
     */
    public static IsMovementDiff(diff: IDump): boolean
    {
        const props = Exportable.ToDict(diff);

        // Delete ID if it exists, because we do not need it
        if(props.id)
        {
            delete props.id;
        }

        // No diff
        if(Object.keys(props).length == 0)
        {
            return true;
        }

        // Only position diff
        if(Object.keys(props).length === 1 &&
            props.hasOwnProperty("position"))
        {
            return true;
        }

        // Only angle diff
        if(Object.keys(props).length === 1 &&
            props.hasOwnProperty("angle"))
        {
            return true;
        }

        // Only position and angle diff
        if(Object.keys(props).length === 2 &&
            props.hasOwnProperty("position") &&
            props.hasOwnProperty("angle"))
        {
            return true;
        }

        return false;
    }

    /**
     * Set an unit (a cell or an actor).
     * @param unit 
     */
    public async SendElement(unit: Unit): Promise<void>
    {
        const dump = Exportable.Export(unit);
        const id = unit.GetId();
        const now = +new Date;
        
        let diff: IDump = null;

        if(this.lastTime.hasOwnProperty(id) && this.last.hasOwnProperty(id))
        {
            diff = Exportable.Diff(dump, this.last[id]);
        }

        if(diff && this.lastTime[id] + SLEEP_TIME >= now && Sender.IsMovementDiff(diff))
        {
            Logger.Info(this, "Element was optimized out", unit);
            return;
        }

        this.last[id] = dump;
        this.lastTime[id] = now;

        if(diff)
        {
            // Hack ID into it
            diff.Payload.push(<IDump>{
                Name: "id",
                Class: "string",
                Payload: id
            });

            return this.SendMessage(MessageType.Diff, diff);
        }

        return this.SendMessage(MessageType.Element, dump);
    }

    /**
     * Set the active player actor for the client (the actor needs to be 
     * already sent via SetElement).
     * @param player 
     */
    public async SendPlayer(player: PlayerActor): Promise<void>
    {
        if(this.player)
        {
            return Promise.resolve();
        }

        this.player = player;

        return this.SendMessage(MessageType.Player, player.GetId());
    }

    /**
     * Send a player's command to a other player.
     * @param command 
     */
    public async SendCommand(command: any[]): Promise<void>
    {
        return this.SendMessage(MessageType.Command, Exportable.Export(command));
    }

    /**
     * Kick the client off.
     */
    public async SendKick(): Promise<void>
    {
        if(!this.channel)
        {
            return;
        }

        Logger.Info(this, "Player was kicked", this.player);

        await this.SendMessage(MessageType.Kick, null);

        this.channel.Close();
        this.channel = null;

        this.server.Kick(this);
    }

    /**
     * Executed when the Connection receives a COMMAND from the client.
     * @param command
     */
    public OnCommand: (command: IDump) => void = Tools.Noop;
}