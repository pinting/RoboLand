import { Helper } from "../Util/Helper";
import { IChannel } from "./IChannel";
import { PlayerActor } from "../Element/Actor/PlayerActor";
import { Exportable } from "../Exportable";
import { MessageType } from "./MessageType";
import { Coord } from "../Coord";
import { BaseElement } from "../Element/BaseElement";
import { IExportObject } from "../IExportObject";
import { IMessage } from "./IMessage";
import { MessageHandler } from "./MessageHandler";

export class Connection extends MessageHandler
{
    private player: PlayerActor;
    
    /**
     * Construct a new connection which communicates with a client.
     * @param channel Direct channel to the client.
     */
    constructor(channel: IChannel)
    {
        super(channel);
    }

    /**
     * Receive a message through the channel.
     * @param message 
     */
    protected OnMessage(message: IMessage): void
    {
        switch(message.Type)
        {
            case MessageType.Command:
                this.ParseCommand(message)
                break;
            default:
                // Invalid: kick?
                break;
        }
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
            return Promise.resolve();
        }

        this.player = player;

        return this.SendMessage(MessageType.Player, player.GetTag());
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