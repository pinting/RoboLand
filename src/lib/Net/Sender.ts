import { Tools } from "../Util/Tools";
import { IChannel } from "./Channel/IChannel";
import { PlayerActor } from "../Element/Actor/PlayerActor";
import { Exportable } from "../Exportable";
import { MessageType } from "./MessageType";
import { Coord } from "../Coord";
import { BaseElement } from "../Element/BaseElement";
import { IExportObject } from "../IExportObject";
import { IMessage } from "./IMessage";
import { MessageHandler } from "./MessageHandler";
import { Server } from "./Server";
import { Logger } from "../Util/Logger";

export class Sender extends MessageHandler
{
    private readonly sleepTime: number = 1000;

    private player: PlayerActor;
    private last: { [id: string]: IExportObject } = {};
    private lastTime: { [id: string]: number } = {};
    
    /**
     * Construct a new connection which communicates with a client.
     * @param channel Direct channel to the client.
     */
    constructor(channel: IChannel)
    {
        super(channel);
    }
    
    /**
     * Get the previously setted player actor.
     */
    public get Player(): PlayerActor
    {
        return this.player;
    }

    /**
     * Receive a message through the channel and parse it.
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
                // Invalid: kick?
                break;
        }
    }

    /**
     * Init board. Also deletes previously setted elements.
     * @param size 
     */
    public async SendSize(size: Coord): Promise<void>
    {
        return this.SendMessage(MessageType.Size, Exportable.Export(size));
    }

    /**
     * Set an element (a cell or an actor).
     * @param element 
     */
    public async SendElement(element: BaseElement): Promise<void>
    {
        const exportable = Exportable.Export(element);
        const now = +new Date;
        
        let diff: IExportObject = null;

        if(this.last.hasOwnProperty(element.Id))
        {
            diff = Exportable.Diff(exportable, this.last[element.Id]);
        }

        if(this.lastTime.hasOwnProperty(element.Id) && 
            this.lastTime[element.Id] + this.sleepTime >= now &&
            Server.OnlyPosDiff(diff))
        {
            Logger.Info(this, "Optimized", element);
            return;
        }

        this.last[element.Id] = exportable;
        this.lastTime[element.Id] = now;

        if(diff && diff.Payload && diff.Payload.length)
        {
            // Hack ID into it
            diff.Payload.push(<IExportObject>{
                Name: "id",
                Class: "string",
                Payload: element.Id
            });
        }

        return this.SendMessage(diff ? MessageType.Diff : MessageType.Element, diff || exportable);
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

        return this.SendMessage(MessageType.Player, player.Id);
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
    public SendKick(): void
    {
        this.SendMessage(MessageType.Kick, null);
    }

    /**
     * Executed when the Connection receives a COMMAND from the client.
     * @param command
     */
    public OnCommand: (command: IExportObject) => void = Tools.Noop;
}