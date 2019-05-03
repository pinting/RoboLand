import { IChannel } from "./Channel/IChannel";
import { MessageType } from "./MessageType";
import { Board } from "../Board";
import { Exportable } from "../Exportable";
import { BaseCell } from "../Element/Cell/BaseCell";
import { BaseActor } from "../Element/Actor/BaseActor";
import { PlayerActor } from "../Element/Actor/PlayerActor";
import { Utils } from "../Tools/Utils";
import { IExportObject } from "../IExportObject";
import { IMessage } from "./IMessage";
import { MessageHandler } from "./MessageHandler";
import { Logger } from "../Tools/Logger";
import { BaseElement } from "../Element/BaseElement";

const MAX_DIST = 0.2;

export class Receiver extends MessageHandler
{
    private board: Board;
    private player: PlayerActor;
    private last: { [id: string]: IExportObject } = {};

    /**
     * Construct a new client which communicates with a connection.
     * @param channel 
     */
    constructor(channel: IChannel, board: Board)
    {
        super(channel);
        
        this.board = board;

        // Add updated element to network cache
        this.board.OnUpdate.Add(element => 
            this.last[element.GetId()] = Exportable.Export(element));
    }

    /**
     * Receive a Message through the channel.
     * @param message 
     */
    protected OnMessage(message: IMessage): void
    {
        Board.Current = this.board;

        switch(message.Type)
        {
            case MessageType.Element:
                this.ReceiveElement(message.Payload);
                break;
            case MessageType.Diff:
                this.ReceiveDiff(message.Payload);
                break;
            case MessageType.Player:
                this.ReceivePlayer(message.Payload);
                break;
            case MessageType.Size:
                this.ReceiveSize(message.Payload);
                break;
            case MessageType.Command:
                this.ReceiveCommand(message.Payload);
                break;
            case MessageType.Kick:
                this.ReceiveKick();
                break;
            default:
                // Invalid
                break;
        }
    }
  
    /**
     * Receive an element.
     * @param exportable
     */
    private async ReceiveElement(exportable: IExportObject): Promise<void>
    {   
        Board.Current = this.board;

        const element: BaseElement = Exportable.Import(exportable);

        Logger.Info(this, "Element was received!", element, exportable);

        // Add element to the board
        if(element instanceof BaseCell)
        {
            this.board.GetCells().Set(element);
        }
        else if(element instanceof BaseActor)
        {
            this.board.GetActors().Set(element);
        }

        // Add to network cache
        this.last[element.GetId()] = exportable;
    }

    /**
     * Receive an diff of an element.
     * @param diff
     */
    private async ReceiveDiff(diff: IExportObject): Promise<void>
    {   
        Board.Current = this.board;

        Logger.Info(this, "Diff was received!", diff);

        // Hack out ID from IExportObject
        const id = diff && diff.Payload && diff.Payload.length && 
            diff.Payload.find(prop => prop.Name == "id").Payload;

        if(!id)
        {
            Logger.Warn(this, "No ID for diff!")
            return;
        }

        // Check if we already have it
        const oldElement = this.board.GetElements().Get(id);

        // Return if we do not have an older version
        if(!oldElement)
        {
            return;
        }

        // If we have an older version, merge it
        const merged = Exportable.Export(oldElement);

        Exportable.Merge(diff, merged);

        const newElement: BaseElement = Exportable.Import(merged);

        // Optimizations
        if(this.last.hasOwnProperty(newElement.GetId()) && 
            BaseElement.IsOnlyPosDiff(diff) && 
            newElement.GetPosition().Len(oldElement.GetPosition()) <= MAX_DIST)
        {
            Logger.Info(this, "Element was optimized out", newElement);
            return;
        }

        return this.ReceiveElement(merged);
    }

    /**
     * Receive the player by id.
     * @param id 
     */
    private ReceivePlayer(id: string): void
    {
        const player = this.player = <PlayerActor>this.board.GetActors().Get(id);

        this.OnPlayer(Utils.Hook(player, (target, prop, args) => 
        {
            const exportable = Exportable.Export([player.GetId(), prop].concat(args));

            this.SendMessage(MessageType.Command, exportable);
        }));
    }

    /**
     * Receive the size of the board.
     * @param size 
     */
    private ReceiveSize(exportable: IExportObject): void
    {
        this.board.Init(Exportable.Import(exportable));
    }

    /**
     * Receive a command from another player.
     * @param command 
     */
    private ReceiveCommand(command: IExportObject): void
    {
        if(!this.player)
        {
            return;
        }

        const args: any[] = Exportable.Import(command);

        if(args.length < 2)
        {
            return;
        }

        const player = <PlayerActor>this.board.GetActors().Get(args[0]);
        
        Board.Current = this.board;

        // Execute command on the player
        player[args[1]].bind(player)(...args.slice(2));

        // Add to network cache
        this.last[player.GetId()] = Exportable.Export(player);
    }

    /**
     * Kick this client of the server.
     */
    private ReceiveKick(): void
    {
        Logger.Warn("Kicked from the server!");
        this.channel.Close();
    }

    /**
     * Executed when the player is set.
     */
    public OnPlayer: (player: PlayerActor) => void = Utils.Noop;
}