import { IChannel } from "./IChannel";
import { MessageType } from "./MessageType";
import { Map } from "../Map";
import { Exportable } from "../Exportable";
import { BaseCell } from "../Element/Cell/BaseCell";
import { BaseActor } from "../Element/Actor/BaseActor";
import { PlayerActor } from "../Element/Actor/PlayerActor";
import { Tools } from "../Util/Tools";
import { Coord } from "../Coord";
import { IExportObject } from "../IExportObject";
import { IMessage } from "./IMessage";
import { MessageHandler } from "./MessageHandler";

export class Receiver extends MessageHandler
{
    private readonly testCount = 100;
    private readonly testDelay = 1;
    private readonly testMaxDist = 0.1;

    private map: Map;
    private player: PlayerActor;

    /**
     * Construct a new client which communicates with a connection.
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
        Map.Current = this.map;

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
        Map.Current = this.map;

        const element = Exportable.Import(exportable);

        if(element instanceof BaseCell)
        {
            this.map.Cells.Set(element);
        }
        else if(element instanceof BaseActor)
        {
            // In case of actors we make some optimization
            const oldElement = this.map.Actors.Get(element.Id);

            if(oldElement)
            {
                const oldExportable = Exportable.Export(oldElement);
                const diff = Exportable.Diff(exportable, oldExportable);
                const names = [];

                // Get the names of the changed elements
                if(diff && diff.Payload && diff.Payload.length)
                {
                    diff.Payload.forEach(e => names.push(e.Name.toString()));
                }

                // Only allow position or direction change
                if((names.length == 2 && 
                        names.includes("position") && 
                        names.includes("direction")) || 
                    (names.length == 1 && 
                        names.includes("position")))
                {
                    let found = false;

                    for(let count = 0; count < this.testCount; count++)
                    {
                        const d = oldElement.Position.GetDistance(element.Position);
            
                        if(d < this.testMaxDist)
                        {
                            found = true;
                        }
            
                        await Tools.Wait(this.testDelay);
                    }

                    if(found)
                    {
                        return;
                    }
                }
            }

            this.map.Actors.Set(element);
        }
    }

    /**
     * Receive the player by id.
     * @param id 
     */
    private ReceivePlayer(id: string)
    {
        const player = this.player = <PlayerActor>this.map.Actors.Get(id);

        this.OnPlayer(Tools.Hook(player, (target, prop, args) => 
        {
            const exportable = Exportable.Export([player.Id, prop].concat(args));

            this.SendMessage(MessageType.Command, exportable);
        }));
    }

    /**
     * Receive the size of the map.
     * @param size 
     */
    private ReceiveSize(exportable: IExportObject)
    {
        this.map.Init(Exportable.Import(exportable));
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

        const player = <PlayerActor>this.map.Actors.Get(args[0]);
        
        Map.Current = this.map;

        // Execute command on the player
        player[args[1]].bind(player)(...args.slice(2));
    }

    /**
     * Kick this client of the server.
     */
    private ReceiveKick()
    {
        this.map.Init(new Coord(0, 0));
    }

    /**
     * Executed when the player is set.
     */
    public OnPlayer: (player: PlayerActor) => void = Tools.Noop;
}