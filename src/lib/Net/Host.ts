import { Tools } from "../Util/Tools";
import { IChannel } from "./Channel/IChannel";
import { PlayerActor } from "../Unit/Actor/PlayerActor";
import { Exportable } from "../Exportable";
import { MessageType } from "./MessageType";
import { Unit } from "../Unit/Unit";
import { IMessage } from "./IMessage";
import { MessageHandler } from "./MessageHandler";
import { Server } from "./Server";
import { Logger } from "../Util/Logger";
import { Dump } from "../Dump";

interface ILastItem
{
    Timestamp: number;
    Dump: Dump;
}

export class Host extends MessageHandler
{
    private static SleepTime = 1000;

    private server: Server;
    private player: PlayerActor;
    private last: { [id: string]: ILastItem } = {};
    
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
     * Receive a message through the channel and parse it.
     * @param message 
     */
    protected OnMessage(message: IMessage, buffer: ArrayBuffer): void
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
     * Send world. Also deletes previously setted units.
     * @param dumb 
     */
    public async SendWorld(dumb: Dump): Promise<void>
    {
        const charArray = Tools.UTF16ToANSI(JSON.stringify(dumb));
        const compressed = Tools.ZLibDeflate(charArray);

        return this.SendMessage(MessageType.World, compressed);
    }

    public async SendResources(buffer: ArrayBuffer)
    {
        return this.SendMessage(MessageType.Resources, buffer);
    }

    /**
     * Set an unit (a cell or an actor).
     * @param unit 
     */
    public async SendUnit(unit: Unit): Promise<void>
    {
        const dump = Exportable.Export(unit);
        const id = unit.GetId();
        const now = +new Date;
        
        let diff: Dump = null;

        if(this.last.hasOwnProperty(id))
        {
            const lastItem = this.last[id];

            diff = Dump.Diff(dump, lastItem.Dump);

            if(lastItem.Timestamp + Host.SleepTime >= now && Dump.TestDump(diff, ["body"]))
            {
                Logger.Debug(this, "Unit was optimized out", unit);
                return;
            }
        }

        this.last[id] = {
            Timestamp: now,
            Dump: dump
        };

        if(diff)
        {
            // Hack ID into it
            diff.Payload.push(<Dump>{
                Name: "id",
                Class: "string",
                Payload: id
            });

            return this.SendMessage(MessageType.Diff, diff);
        }

        return this.SendMessage(MessageType.Unit, dump);
    }

    /**
     * Set the active player actor for the client (the actor needs to be 
     * already sent via SetUnit).
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
    public OnCommand: (command: Dump) => void = Tools.Noop;
}