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
import { Filo } from "../Util/Filo";
import { TickActor } from "../Element/Actor/TickActor";
import { Logger } from "../Util/Logger";
import { LogType } from "../Util/LogType";

export class Receiver extends MessageHandler
{
    private readonly lastSize: number = 1000;

    private board: Board;
    private player: PlayerActor;
    private last: Filo<IExportObject> = new Filo(this.lastSize);

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
            this.last.Add(Exportable.Export(element)));
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
     * @param element 
     */
    private async ReceiveElement(exportable: IExportObject)
    {   
        Board.Current = this.board;

        const element = Exportable.Import(exportable);
        const oldElement = this.board.Elements.Get(element.Id);
        const oldExportable = Exportable.Export(oldElement);

        Logger.Log(this, LogType.Verbose, "Element was received!", element, exportable);

        // Add to network cache
        this.last.Add(exportable);

        // Optimizations
        if(oldElement)
        {
            if(element instanceof TickActor)
            {
                Logger.Log(this, LogType.Verbose, "Optimized!", element);
                return;
            }
            else if(element instanceof BaseActor)
            {
                if(this.last.List.some(e => Exportable.Diff(e, oldExportable) == null))
                {
                    Logger.Log(this, LogType.Verbose, "Optimized", element);
                    return;
                }
            }
        }

        // Add element to the board
        if(element instanceof BaseCell)
        {
            this.board.Cells.Set(element);
        }
        else if(element instanceof BaseActor)
        {
            this.board.Actors.Set(element);
        }
    }

    /**
     * Receive the player by id.
     * @param id 
     */
    private ReceivePlayer(id: string)
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
    private ReceiveSize(exportable: IExportObject)
    {
        this.board.Init(Exportable.Import(exportable));
    }

    /**
     * Receive a command from another player.
     * @param command 
     */
    private ReceiveCommand(command: IExportObject)
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
        this.last.Add(Exportable.Export(player));
    }

    /**
     * Kick this client of the server.
     */
    private ReceiveKick()
    {
        this.board.Init(new Coord(0, 0));
    }

    /**
     * Executed when the player is set.
     */
    public OnPlayer: (player: PlayerActor) => void = Tools.Noop;
}