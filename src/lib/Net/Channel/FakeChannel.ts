import { IChannel } from "./IChannel";
import { Utils } from "../../Tools/Utils";
import { Logger } from "../../Tools/Logger";

export class FakeChannel implements IChannel
{
    private delay: number = 0;
    private other: FakeChannel;

    /**
     * Construct a new fake channel with the given delay.
     * @param delay 
     */
    public constructor(delay: number = 0)
    {
        this.delay = delay;
    }

    /**
     * Set the other peer.
     * @param other 
     */
    public SetOther(other: FakeChannel)
    {
        this.other = other;
    }
    
    /**
     * Send a Message to the other peer.
     * @param message 
     */
    public SendMessage(message: string): void 
    {
        if(this.other)
        {
            setTimeout(() => this.other.OnMessage(message), this.delay);
        }
    }

    /**
     * Close the channel.
     */
    public Close()
    {
        Logger.Info("Channel was closed!");
    }

    /**
     * Receive a Message from the other peer.
     */
    public OnMessage: (message: string) => void = Utils.Noop;
}