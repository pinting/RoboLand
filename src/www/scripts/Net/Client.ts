import { IChannel } from "./IChannel";
import { MessageType } from "./MessageType";
import { Map } from "../Map";
import { Exportable } from "../Exportable";
import { BaseCell } from "../Element/Cell/BaseCell";
import { BaseActor } from "../Element/Actor/BaseActor";
import { PlayerActor } from "../Element/Actor/PlayerActor";
import { Helper } from "../Util/Helper";
import { Coord } from "../Coord";
import { IExportObject } from "../IExportObject";
import { IMessage } from "./IMessage";
import { Logger } from "../Util/Logger";
import { LogType } from "../Util/LogType";

export class Client
{
    private readonly channel: IChannel;
    private readonly map: Map;

    private outIndex: number = 0;

    /**
     * Construct a new client.
     * @param channel 
     */
    constructor(channel: IChannel, map: Map)
    {
        this.channel = channel;
        this.map = map;

        this.channel.OnMessage = (message: string) => this.OnMessage(message);
    }

    /**
     * Send a message through the channel.
     * @param type Type of the message.
     * @param payload Payload.
     */
    private SendMessage(type: MessageType, payload: any): void
    {
        const message: IMessage = {
            Type: type,
            Index: this.outIndex++,
            Payload: payload
        };

        this.channel.SendMessage(JSON.stringify(message));
        Logger.Log(this, LogType.Verbose, "Client message sent", message);
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

        Logger.Log(this, LogType.Verbose, "Client message received", parsed);
        
        switch(parsed.Type)
        {
            case MessageType.Element:
                this.SetElement(parsed.Payload)
                break;
            case MessageType.Player:
                this.SetPlayer(parsed.Payload);
                break;
            case MessageType.Size:
                this.SetSize(parsed.Payload);
                break;
            case MessageType.Kick:
                this.Kick();
                break;
            default:
                // Invalid
                break;
        }

        this.SendMessage(MessageType.Ack, parsed.Index);
    }

    /**
     * Set element.
     * @param element 
     */
    private SetElement(exportable: IExportObject)
    {
        // Set the args of the constructor of BaseElement 
        exportable.Args = [null, this.map];

        const element = Exportable.Import(exportable);

        if(element instanceof BaseCell)
        {
            this.map.GetCells().Set(element);
        }
        else if(element instanceof BaseActor)
        {
            this.map.GetActors().Set(element);
        }
    }

    /**
     * Set the player by tag.
     * @param tag 
     */
    private SetPlayer(tag: string)
    {
        const player = this.map.GetActors().Tag(tag);

        this.OnPlayer(Helper.Hook(player, (target, prop, args) => 
        {
            const exportable = Exportable.Export([prop].concat(args));

            this.SendMessage(MessageType.Command, exportable);
        }));
    }

    /**
     * Set the size of the map.
     * @param size 
     */
    private SetSize(exportable: IExportObject)
    {
        this.map.Init(Exportable.Import(exportable));
    }

    /**
     * Kick this client of the server.
     */
    private Kick()
    {
        this.map.Init(new Coord(0, 0));
    }

    /**
     * Executed when the player is set.
     */
    public OnPlayer: (player: PlayerActor) => void = Helper.Noop;
}