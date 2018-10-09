import { IChannel } from "./Channel/IChannel";
import { MessageType } from "./MessageType";
import { Board } from "../Board";
import { Exportable } from "../Exportable";
import { BaseCell } from "../Element/Cell/BaseCell";
import { BaseActor } from "../Element/Actor/BaseActor";
import { PlayerActor } from "../Element/Actor/PlayerActor";
import { Tools } from "../Util/Tools";
import { Coord } from "../Coord";
import { IExportObject } from "../IExportObject";
import { IMessage } from "./IMessage";
import { MessageHandler } from "./MessageHandler";
import { Logger } from "../Util/Logger";
import { Server } from "./Server";
import { BaseElement } from "../Element/BaseElement";

export class Receiver extends MessageHandler
{
    private readonly maxDistance: number = 2;

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
            this.last[element.Id] = Exportable.Export(element));
    }

    /**
     * Receive a message through the channel.
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
            this.board.Cells.Set(element);
        }
        else if(element instanceof BaseActor)
        {
            this.board.Actors.Set(element);
        }

        // Add to network cache
        this.last[element.Id] = exportable;
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
        const oldElement = this.board.Elements.Get(id);

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
        if(this.last.hasOwnProperty(newElement.Id) && 
            Server.OnlyPosDiff(diff) && 
            newElement.Position.GetDistance(oldElement.Position) <= this.maxDistance)
        {
            Logger.Info(this, "Optimized", newElement);
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
        const player = this.player = <PlayerActor>this.board.Actors.Get(id);

        this.OnPlayer(Tools.Hook(player, (target, prop, args) => 
        {
            const exportable = Exportable.Export([player.Id, prop].concat(args));

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

        const player = <PlayerActor>this.board.Actors.Get(args[0]);
        
        Board.Current = this.board;

        // Execute command on the player
        player[args[1]].bind(player)(...args.slice(2));

        // Add to network cache
        this.last[player.Id] = Exportable.Export(player);
    }

    /**
     * Kick this client of the server.
     */
    private ReceiveKick(): void
    {
        this.board.Init(new Coord(0, 0));
        Logger.Warn("Kicked!");
    }

    /**
     * Executed when the player is set.
     */
    public OnPlayer: (player: PlayerActor) => void = Tools.Noop;
}