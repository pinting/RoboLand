import { IChannel } from "./IChannel";
import { Tools } from "../../Util/Tools";
import { Logger } from "../../Util/Logger";

export class FakeChannel implements IChannel
{
    private delay: number = 0;
    private other: FakeChannel;

    /**
     * Construct a new fake channel with a given fake delay.
     * @param delay 
     */
    public constructor(delay: number = 0)
    {
        this.delay = delay;
    }

    public SetOther(other: FakeChannel)
    {
        this.other = other;
    }

    public SendMessage(message: ArrayBuffer): void 
    {
        if(this.other)
        {
            setTimeout(() => this.other.OnMessage(message), this.delay);
        }
    }

    public Close()
    {
        Logger.Info(this, "Channel was closed!");
    }

    public OnMessage: (message: ArrayBuffer) => void = Tools.Noop;
}