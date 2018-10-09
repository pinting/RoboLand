import { BaseActor, BaseActorArgs } from "./BaseActor";
import { Logger } from "../../Util/Logger";

export abstract class TickActor extends BaseActor
{
    private tickEvent: number;
    
    /**
     * @inheritDoc
     */
    public Init(args: BaseActorArgs = {})
    {
        super.Init(args);
    }

    /**
     * @inheritDoc
     */
    protected InitPost(args: BaseActorArgs = {})
    {
        super.InitPost(args);

        // Start to listen to the tick event
        this.tickEvent = this.board.OnTick.Add(() => this.OnTick());

        Logger.Info(this, "Tick event was set", this);
    }

    /**
     * @inheritDoc
     */
    public Dispose(value: boolean = true)
    {
        this.board.OnTick.Remove(this.tickEvent);
        super.Dispose(value);
    }
    
    /**
     * Called upon tick.
     */
    protected abstract OnTick(): void;
}