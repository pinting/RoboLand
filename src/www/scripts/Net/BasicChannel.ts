import { IChannel } from "./IChannel";
import { Helper } from "../Util/Helper";

export class BasicChannel implements IChannel
{
    private other: BasicChannel;

    /**
     * Set the other peer.
     * @param other 
     */
    public SetOther(other: BasicChannel)
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
            // Simulate latency between 20 and 100 ms
            setTimeout(() => this.other.OnMessage(message), Helper.Random(20, 100));
        }
    }

    /**
     * Receive a message from the other peer.
     */
    public OnMessage: (message: string) => void = Helper.Noop;
}