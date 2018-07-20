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
import { MessageHandler } from "./MessageHandler";

export class Client extends MessageHandler
{
    private readonly map: Map;

    /**
     * Construct a new client.
     * @param channel 
     */
    constructor(channel: IChannel, map: Map)
    {
        super(channel);
        
        this.map = map;
    }

    /**
     * Receive a message through the channel.
     * @param message 
     */
    protected OnMessage(message: IMessage): void
    {
        switch(message.Type)
        {
            case MessageType.Element:
                this.SetElement(message.Payload)
                break;
            case MessageType.Player:
                this.SetPlayer(message.Payload);
                break;
            case MessageType.Size:
                this.SetSize(message.Payload);
                break;
            case MessageType.Kick:
                this.Kick();
                break;
            default:
                // Invalid
                break;
        }
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