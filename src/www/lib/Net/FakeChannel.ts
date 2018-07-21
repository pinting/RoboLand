import { IChannel } from "./IChannel";
import { Helper } from "../Util/Helper";

export class FakeChannel implements IChannel
{
    private other: FakeChannel;
    private delay: number;

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
     * Send a message to the other peer.
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
     * Receive a message from the other peer.
     */
    public OnMessage: (message: string) => void = Helper.Noop;
}