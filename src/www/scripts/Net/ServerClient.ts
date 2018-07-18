import { Utils } from "../Utils";
import { IChannel } from "./IChannel";
import { PlayerActor } from "../Element/Actor/PlayerActor";
import { Exportable } from "../Exportable";
import { MessageType } from "./MessageType";
import { Coord } from "../Coord";
import { BaseElement } from "../Element/BaseElement";
import { IMessageIn } from "./IMessageIn";
import { IMessageOut } from "./IMessageOut";
import { IExportObject } from "../IExportObject";

export class ServerClient
{
    private readonly timeout: number = 1000;

    private listeners: Array<(ack: number) => void> = [];
    private count: number = 0;
    
    private channel: IChannel;
    private player: PlayerActor;
    
    /**
     * Construct a new server client.
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
        let parsed: IMessageIn;

        try 
        {
            parsed = JSON.parse(message);
        }
        catch(e)
        {
            return;
        }

        switch(parsed.Type)
        {
            case MessageType.Ack:
                this.listeners.forEach(f => f(parsed.Payload));
                break;
            case MessageType.Command:
                this.OnCommand(parsed.Payload);
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
            let timeout;

            // Create the message
            const message: IMessageOut = {
                Type: type,
                Index: this.count++,
                Payload: payload
            };

            // Create a new ack listener
            const listener = ack => 
            {
                if(ack === message.Index)
                {
                    // If ack received, remove the listener and resolve
                    remove(listener);
                    resolve();
                }
            };

            // Remove a listener from the list
            const remove = listener =>
            {
                const index = this.listeners.indexOf(listener);

                if(index)
                {
                    this.listeners.splice(index, 1);
                }

                if(timeout != undefined)
                {
                    clearTimeout(timeout);
                }
            };

            // Set a timeout if ack never received
            timeout = setTimeout(() => remove(listener) || reject(), this.timeout);

            // Add listener and send message
            this.listeners.push(listener);
            this.channel.SendMessage(JSON.stringify(message));
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
    public OnCommand: (command: IExportObject) => void = Utils.Noop;
}