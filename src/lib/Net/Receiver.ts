import { IChannel } from "./Channel/IChannel";
import { MessageType } from "./MessageType";
import { Board } from "../Board";
import { Exportable } from "../Exportable";
import { BaseCell } from "../Element/Cell/BaseCell";
import { BaseActor } from "../Element/Actor/BaseActor";
import { PlayerActor } from "../Element/Actor/PlayerActor";
import { Tools } from "../Util/Tools";
import { IDump } from "../IDump";
import { IMessage } from "./IMessage";
import { MessageHandler } from "./MessageHandler";
import { Logger } from "../Util/Logger";
import { BaseElement } from "../Element/BaseElement";
import { Sender } from "./Sender";
import { Vector } from "../Geometry/Vector";

const MAX_POS_DIFF = 0.5;
const MAX_ANGLE_DIFF = Vector.DegToRad(45);

export class Receiver extends MessageHandler
{
    private board: Board;
    private player: PlayerActor;
    private last: { [id: string]: IDump } = {};

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
     * @param dump
     */
    private async ReceiveElement(dump: IDump): Promise<void>
    {   
        Board.Current = this.board;

        const element: BaseElement = Exportable.Import(dump);

        Logger.Info(this, "Element was received!", element, dump);

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
        this.last[element.GetId()] = dump;
    }

    /**
     * Receive an diff of an element.
     * @param diff
     */
    private async ReceiveDiff(diff: IDump): Promise<void>
    {
        Logger.Info(this, "Diff was received!", diff);

        // Hack out ID from the dump
        const id = diff && diff.Payload && diff.Payload.length && 
            diff.Payload.find((prop: IDump) => prop.Name == "id").Payload;

        if(!id)
        {
            Logger.Warn(this, "No ID for diff!");
            return;
        }

        // Check if we already have it
        const oldElement = this.board.GetElements().Get(id);

        // Return if we do not have an older version,
        // because we cannot receive a diff without a base
        if(!oldElement)
        {
            Logger.Warn(this, "Received diff, but no base element!");
            return;
        }

        Board.Current = this.board;

        // If we have an older version, merge it
        const merged = Exportable.Export(oldElement);

        Exportable.Merge(merged, diff);

        const newElement: BaseElement = Exportable.Import(merged);

        // If the position or the angle difference is under a limit, skip updating
        if(Sender.IsMovementDiff(diff) && oldElement.GetPosition())
        {
            const posititonDiff = newElement.GetPosition().Dist(oldElement.GetPosition());
            const angleDiff = Math.abs(newElement.GetAngle() - oldElement.GetAngle());

            if(posititonDiff < MAX_POS_DIFF && angleDiff < MAX_ANGLE_DIFF)
            {
                Logger.Info(this, "Element was optimized out", newElement);
                return;
            }
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

        this.OnPlayer(Tools.Hook(player, (target, prop, args) => 
        {
            const dump = Exportable.Export([player.GetId(), prop].concat(args));

            this.SendMessage(MessageType.Command, dump);
        }));
    }

    /**
     * Receive the size of the board.
     * @param size 
     */
    private ReceiveSize(dump: IDump): void
    {
        this.board.Init(Exportable.Import(dump));
    }

    /**
     * Receive a command from another player.
     * @param command 
     */
    private ReceiveCommand(command: IDump): void
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
    public OnPlayer: (player: PlayerActor) => void = Tools.Noop;
}