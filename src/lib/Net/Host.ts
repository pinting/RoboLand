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
import { Body } from "../Physics/Body";

interface ILastItem
{
    Timestamp: number;
    Dump: Dump;
}

export class Host extends MessageHandler
{
    private static DisableOptimization = false;
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

    public async SendUnit(unit: Unit): Promise<void>
    {
        const dump = Exportable.Export(unit);
        const id = unit.GetId();
        const now = +new Date;
        
        let diff: Dump = null;

        if(!Host.DisableOptimization && this.last.hasOwnProperty(id))
        {
            const lastItem = this.last[id];

            diff = Dump.Diff(dump, lastItem.Dump);

            if(lastItem.Timestamp + Host.SleepTime >= now && Dump.TestDump(diff, ["body"]))
            {
                const newUnit = Exportable.Import(dump) as Unit;
                const oldUnit = Exportable.Import(lastItem.Dump) as Unit;
                const newBody = newUnit.GetBody();
                const oldBody = oldUnit.GetBody();
        
                // If only a positional difference is present which is under a limit, skip updating
                if(Body.Equal(newBody, oldBody))
                {
                    Logger.Debug(this, "Unit was optimized out", newUnit);
                    return;
                }
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
     * Set the active player actor for the client.
     * The player must be already present on the other side.
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
     * Executed when the host receives a COMMAND from the client.
     * @param command
     */
    public OnCommand: (command: Dump) => void = Tools.Noop;
}