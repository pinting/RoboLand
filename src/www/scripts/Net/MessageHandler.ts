import { IChannel } from "./IChannel";
import { MessageType } from "./MessageType";
import { IMessage } from "./IMessage";
import { TimeoutEvent } from "../Util/TimeoutEvent";
import { Event } from "../Util/Event";
import { Logger } from "../Util/Logger";
import { LogType } from "../Util/LogType";

export abstract class MessageHandler
{
    private receivedEvent = new Event<number>();
    private outIndex: number = 0;
    private inIndex: number;

    private channel: IChannel;

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
     * Receive a message through the channel.
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
            case MessageType.Element:
                // Receive only states newer than the current one
                if(message.Index > this.inIndex || this.inIndex === undefined)
                {
                    this.inIndex = message.Index;
                    this.OnMessage(message);
                }

                this.SendReceived(message);
                break;
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

        Logger.Log(this, LogType.Verbose, "Message received", message);
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
    * Send a message through the channel.
    * @param type Type of the message.
    * @param payload
    */
   protected async SendMessage(type: MessageType, payload: any): Promise<void>
   {
       return new Promise<void>((resolve, reject) => 
       {
           // Create the message
           const message: IMessage = {
               Type: type,
               Index: this.outIndex++,
               Payload: payload
           };

           // Create a new RECEIVED listener if this was not
           // a acknowledge message
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

           // Send message
           this.channel.SendMessage(JSON.stringify(message));

           Logger.Log(this, LogType.Verbose, "Message sent", message);
       });
   }

   protected abstract OnMessage(message: IMessage): void;
}