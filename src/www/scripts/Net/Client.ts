import { IChannel } from "./IChannel";
import { IMessageOut } from "./IMessageOut";
import { MessageType } from "./MessageType";
import { Map } from "../Map";
import { Exportable } from "../Exportable";
import { BaseCell } from "../Element/Cell/BaseCell";
import { BaseActor } from "../Element/Actor/BaseActor";
import { PlayerActor } from "../Element/Actor/PlayerActor";
import { Utils } from "../Utils";
import { IMessageIn } from "./IMessageIn";
import { Coord } from "../Coord";
import { BaseElement } from "../Element/BaseElement";

export class Client
{
    private readonly channel: IChannel;
    private readonly map: Map;

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
        const message: IMessageIn = {
            Type: type,
            Payload: payload
        };

        this.channel.SendMessage(JSON.stringify(message));
    }

    /**
     * Receive a message through the channel.
     * @param message 
     */
    private OnMessage(message: string): void
    {
        let parsed: IMessageOut;

        try 
        {
            parsed = JSON.parse(message);

            if(!parsed || !parsed.Payload || !parsed.Index)
            {
                return;
            }
        }
        catch(e)
        {
            return;
        }
        
        switch(parsed.Type)
        {
            case MessageType.Element:
                this.SetElement(Exportable.Import(parsed.Payload))
                break;
            case MessageType.Player:
                this.SetPlayer(parsed.Payload);
                break;
            case MessageType.Size:
                this.map.Init(Exportable.Import(parsed.Payload));
                break;
            case MessageType.Kick:
                this.map.Init(new Coord);
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
    private SetElement(element: BaseElement)
    {
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
        const player = this.map.GetActors().Get(tag)[0];

        this.OnPlayer(Utils.Hook(player, (target, prop, args) => 
            this.SendMessage(MessageType.Command, [prop].concat(args))));
    }

    /**
     * Executed when the player is set.
     */
    public OnPlayer: (player: PlayerActor) => void = Utils.Noop;
}