import { IChannel } from "./Channel/IChannel";
import { MessageType } from "./MessageType";
import { IMessage } from "./IMessage";
import { Event } from "../Tools/Event";
import { Logger } from "../Tools/Logger";

export abstract class MessageHandler
{
    private receivedEvent = new Event<number>();
    private outIndex: number = 0;
    private inIndex: number;

    protected channel: IChannel;

    /**
     * Construct a new connection which communicates with a client.
     * @param channel Direct channel to the client.
     */
    constructor(channel: IChannel)
    {
        this.channel = channel;
        this.channel.OnMessage = (message: string) => this.ParseMessage(message);
    }

    /**
     * Receive a Message through the channel.
     * @param input 
     */
    private ParseMessage(input: string): void
    {
        let message: IMessage;

        try 
        {
            message = JSON.parse(input);
        }
        catch(e)
        {
            return;
        }

        switch(message.Type)
        {
            case MessageType.Diff:
                // Receive only states newer than the current one
                if(message.Index > this.inIndex || this.inIndex === undefined)
                {
                    this.inIndex = message.Index;
                    this.OnMessage(message);
                }

                this.SendReceived(message);
                break;
            case MessageType.Element:
            case MessageType.Command:
            case MessageType.Player:
            case MessageType.Kick:
            case MessageType.Size:
                this.OnMessage(message);
                this.SendReceived(message);
                break;
            case MessageType.Received:
                this.ParseReceived(message);
                break;
        }

        Logger.Info(this, "Message was received", message);
    }

    /**
     * Parse incoming ACK.
     * @param message 
     */
    private ParseReceived(message: IMessage)
    {
        this.receivedEvent.Call(message.Payload);
    }

    /**
     * Send ACK.
     * @param message 
     */
    private SendReceived(message: IMessage)
    {
        this.SendMessage(MessageType.Received, message.Index);
    }

    /**
    * Send a Message through the channel.
    * @param type Type of the Message.
    * @param payload
    */
   protected async SendMessage(type: MessageType, payload: any): Promise<void>
   {
       return new Promise<void>((resolve, reject) => 
       {
           // Create the Message
           const message: IMessage = {
               Type: type,
               Index: this.outIndex++,
               Payload: payload
           };

           // Create a new RECEIVED listener if this was not
           // a acknowledge Message
           if (message.Type != MessageType.Received) 
           {
                const listener = this.receivedEvent.Add(index => 
                {
                   if (index === message.Index) 
                   {
                       this.receivedEvent.Remove(listener);
                       resolve();
                   }
                   else if (index === null) {
                       reject();
                   }
               });
           }
           else
           {
               // Resolve immediately if RECEIVED
               resolve();
           }

           // Send Message
           this.channel.SendMessage(JSON.stringify(message));

           Logger.Info(this, "Message was sent", message);
       });
   }

   protected abstract OnMessage(message: IMessage): void;
}