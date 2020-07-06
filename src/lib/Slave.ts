import { World } from "./World";
import { Exportable, ExportType } from "./Exportable";
import { Dump } from "./Dump";
import { Event } from "./Util/Event";
import { Tools } from "./Util/Tools";
import { Logger } from "./Util/Logger";
import { Unit } from "./Unit/Unit";
import { ArrowActor } from "./Unit/Actor/ArrowActor";
import { PlayerActor } from "./Unit/Actor/PlayerActor";
import { DamageCell } from "./Unit/Cell/DamageCell";
import { NormalCell } from "./Unit/Cell/NormalCell";
import { KillCell } from "./Unit/Cell/KillCell";
import { Vector } from "./Geometry/Vector";
import { Matrix } from "./Geometry/Matrix";
import { Polygon } from "./Geometry/Polygon";
import { Body } from "./Physics/Body";

declare const WorkerGlobalScope: Function;
declare const self: {
    postMessage: (payload: any) => void;
    onmessage: (event: { data: IMessage }) => void;
};

enum MessageType
{
    WorldDump = "WorldDump",
    UnitUpdate = "UnitUpdate",
    Eval = "Eval",
    Result = "Result"
}

interface IMessage
{
    Id: string,
    Type: MessageType,
    Data: any;
}

/**
 * Slaves are having the same world as their master, however, they do
 * not recive ticks and no rendering is done in them. Each modification
 * in the master triggers a sync towards the slaves - and each slave sync
 * their master.
 * 
 * Currently there is no code that relies on the SLAVE -> MASTER syncing.
 */
export class Slave
{
    public static WorkerUrl = "slave.js";

    private readonly world: World;
    private readonly worker: Worker;
    private readonly updateEvent: number;

    private readonly OnResult: Event<IMessage> = new Event<IMessage>();

    private load = 0;

    /**
     * Construct a new slave by setting up the message channel
     * and copying the given world into it.
     * @param world 
     */
    constructor(world: World)
    {
        this.world = world;
        this.updateEvent = world.OnUpdate.Add(unit => this.SendUnit(unit));

        this.worker = new Worker(Slave.WorkerUrl);
        this.worker.onmessage = (event: { data: IMessage }) =>
        {
            if(!event || !event.data)
            {
                return;
            }

            const message = event.data;

            this.OnMessage(message);
        }

        this.SendWorld(world);
    }

    /**
     * Destory the unit sync event and terminate the worker.
     */
    public Destroy()
    {
        this.world.OnUpdate.Remove(this.updateEvent);
        this.worker.terminate();
    }

    /**
     * Get the current load of the worker.
     * One unit means one pending task.
     */
    public GetLoad()
    {
        return this.load;
    }
    
    /**
     * Send a message to the worker.
     * @param data Any data. Functions cannot be converted, so keep it simple.
     * @param type Type of the message.
     * @param id A unique ID that is used to pair request messages with answer messages.
     */
    private SendMessage(data: any, type: MessageType, id = Tools.Unique())
    {
         this.worker.postMessage({
             Id: id,
             Type: type,
             Data: data
         });
    }

    /**
     * Receive a message from the worker.
     * @param message 
     */
    private OnMessage(message: IMessage)
    {
        switch (message.Type) 
        {
            case MessageType.UnitUpdate:
                this.OnUnit(message.Data);
                break;
            case MessageType.Result:
                this.OnResult.Call(message);
                break;
            default:
                Logger.Warn("Unknown MessageType in WorldThread");
                break;
        }
    }

    private OnUnit(dump: Dump)
    {
        const unit = Exportable.Import(dump);

        this.world.Set(unit);
    }

    private SendWorld(world: World)
    {
        const dump = Exportable.Export(world);

        this.SendMessage(dump, MessageType.WorldDump);
    }

    private SendUnit(unit: Unit)
    {
        const dump = Exportable.Export(unit);

        this.SendMessage(dump, MessageType.UnitUpdate);
    }

    /**
     * Send an eval typed message to the worker.
     * @param args This list will be passed to the callback, can be empty.
     * @param cb A callback which will be convereted to string. Receives world + master set args.
     */
    public async SendEval<T = any>(args: any[], cb: (world: World, ...args: any[]) => T): Promise<T>
    {
        const id = Tools.Unique();

        this.load++;
        
        this.SendMessage([cb.toString(), ...args], MessageType.Eval, id);

        return new Promise(resolve =>
        {
            // Create a new listener on the onResult event. If a
            // result comes in with the same ID as the sent eval,
            // resolve the promise.
            const onMessageEvent = this.OnResult.Add(message => 
            {
                if(message.Id == id)
                {
                    this.load--;

                    this.OnResult.Remove(onMessageEvent);
                    resolve(message.Data);
                }
            });
        });
    }

    /**
     * Check if the JavaScript process is a web worker.
     */
    public static IsWorker()
    {
        return typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
    }

    /**
     * Setup the worker environment.
     * NOTE: This should be only run inside a web worker process!
     */
    public static SetupWorker()
    {
        if(!Slave.IsWorker())
        {
            throw new Error("Not a WebWorker instance!");
        }

        // Export inner modules so callbacks can access them
        Tools.Extract(self, {
            Dump,
            World,
            Tools,
            Exportable,
            NormalCell,
            DamageCell,
            KillCell,
            PlayerActor,
            ArrowActor,
            Vector,
            Matrix,
            Body,
            Polygon
        });

        // The world object of the worker
        let world: World;
        let ignoreUpdate: string[] = [];

        const SendMessage = (data: any, type: MessageType, id = Tools.Unique()) =>
        {
             self.postMessage({
                 Id: id,
                 Type: type,
                 Data: data
             });
        };

        const OnMessage = (message: IMessage) =>
        {
            switch (message.Type) 
            {
                case MessageType.WorldDump:
                    OnWorld(message.Data);
                    break;
                case MessageType.UnitUpdate:
                    OnUnit(message.Data);
                    break;
                case MessageType.Eval:
                    OnEval(message.Data, message.Id);
                    break;
                default:
                    Logger.Warn("Unknown MessageType in WorldThread");
                    break;
            }
        };

        const OnWorld = (dump: Dump) =>
        {
            world = Exportable.Import(dump);

            world.OnUpdate.Add(unit => 
            {
                const id = unit.GetId();

                // We need to ignore the first update of those
                // units that the worker is updating in the master.
                // Otherwise an infinite update circular would emerge.
                if(ignoreUpdate.includes(id))
                {
                    ignoreUpdate.splice(ignoreUpdate.indexOf(id), 1)
                    return;
                }

                const dump = Exportable.Export(unit, null, ExportType.Thread);

                SendMessage(dump, MessageType.UnitUpdate);
            });
        };

        const OnUnit = (dump: Dump) =>
        {
            if(!world)
            {
                return;
            }

            const unit = Exportable.Import(dump) as Unit;
            const id = unit.GetId();

            ignoreUpdate.push(id);
            world.Set(unit);
        };

        /**
         * Parse command coming from the master.
         * @param input An array. First element is a string function, the rest are the params.
         * @param id ID of the message.
         */
        const OnEval = (input: any[], id: string) =>
        {
            if(!input.length)
            {
                throw new Error("Input must have minimum one item, the function.");
            }

            const fn = input[0];
            const args = input.slice(1) || [];
            const cb = new Function("return " + fn)();
            const result = cb(world, ...args);

            SendMessage(result, MessageType.Result, id);
        };

        self.onmessage = (event: { data: IMessage}) =>
        {
            if(!event || !event.data)
            {
                return;
            }

            const message = event.data;

            OnMessage(message);
        };
    }
}