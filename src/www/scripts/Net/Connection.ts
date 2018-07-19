import { Helper } from "../Util/Helper";
import { IChannel } from "./IChannel";
import { PlayerActor } from "../Element/Actor/PlayerActor";
import { Exportable } from "../Exportable";
import { MessageType } from "./MessageType";
import { Coord } from "../Coord";
import { BaseElement } from "../Element/BaseElement";
import { IExportObject } from "../IExportObject";
import { IMessage } from "./IMessage";
import { Logger } from "../Util/Logger";
import { LogType } from "../Util/LogType";
import { TimeoutEvent } from "../Util/TimeoutEvent";

export class Connection
{
    private readonly timeout: number = 1000;

    private ackEvent = new TimeoutEvent<number>(this.timeout);
    private outIndex: number = 0;
    
    private channel: IChannel;
    private player: PlayerActor;
    
    /**
     * Construct a new connection which communicates with a client.
     * @param channel Direct channel to the client.
     */
    constructor(channel: IChannel)
    {
        this.channel = channel;
        this.channel.OnMessage = (message: string) => this.OnMessage(message);
    }

    /**
     * Receive a message through the channel.
     * @param message 
     */
    private OnMessage(message: string): void
    {
        let parsed: IMessage;

        try 
        {
            parsed = JSON.parse(message);
        }
        catch(e)
        {
            return;
        }

        Logger.Log(this, LogType.Verbose, "Server message received", parsed);

        switch(parsed.Type)
        {
            case MessageType.Ack:
                this.ParseAck(parsed.Payload);
                break;
            case MessageType.Command:
                this.ParseCommand(parsed)
                break;
            default:
                // Invalid: kick?
                break;
        }
    }

    /**
     * Send a message through the channel.
     * @param type Type of the message.
     * @param payload Payload.
     */
    private async SendMessage(type: MessageType, payload: any): Promise<void>
    {
        return new Promise<void>((resolve, reject) => 
        {
            // Create the message
            const message: IMessage = {
                Type: type,
                Index: this.outIndex++,
                Payload: payload
            };

            // Create a new ack listener
            const listener = index => 
            {
                if(index === message.Index)
                {
                    this.ackEvent.Remove(listener);
                    resolve();
                }
                else if(index === null)
                {
                    reject();
                }
            };

            // Add listener and send message
            this.ackEvent.Add(listener);
            this.channel.SendMessage(JSON.stringify(message));

            Logger.Log(this, LogType.Verbose, "Server message sent", message);
        });
    }

    /**
     * Init map. Also deletes previously setted elements.
     * @param size 
     */
    public async SetSize(size: Coord): Promise<void>
    {
        return this.SendMessage(MessageType.Size, Exportable.Export(size));
    }

    /**
     * Set an element (a cell or an actor).
     * @param element 
     */
    public async SetElement(element: BaseElement): Promise<void>
    {
        return this.SendMessage(MessageType.Element, Exportable.Export(element));
    }

    /**
     * Set the active player actor for the client (the actor needs to be 
     * already sent via SetElement).
     * @param player 
     */
    public async SetPlayer(player: PlayerActor): Promise<void>
    {
        if(this.player)
        {
            return;
        }

        this.player = player;

        return this.SendMessage(MessageType.Player, player.GetTag());
    }

    /**
     * Parse incoming ACK.
     * @param index 
     */
    private ParseAck(index: number)
    {
        this.ackEvent.Call(index);
    }

    /**
     * Parse an incoming COMMAND.
     * @param index 
     * @param command 
     */
    public ParseCommand(message: IMessage): void
    {
        this.OnCommand(message.Payload);
    }
    
    /**
     * Get the previously setted player actor.
     */
    public GetPlayer(): PlayerActor
    {
        return this.player;
    }

    /**
     * Kick the client off.
     */
    public Kick(): void
    {
        this.SendMessage(MessageType.Kick, null);
    }

    /**
     * Executed when the client sends a command.
     */
    public OnCommand: (command: IExportObject) => void = Helper.Noop;
}