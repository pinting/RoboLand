import { IChannel } from "./IChannel";
import { Utils } from "../Utils";

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
            setTimeout(() => this.other.OnMessage(message), Utils.Random(20, 100));
        }
    }

    /**
     * Receive a message from the other peer.
     */
    public OnMessage: (message: string) => void = Utils.Noop;
}