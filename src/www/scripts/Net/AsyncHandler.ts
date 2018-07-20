import { IChannel } from "./IChannel";
import { MessageType } from "./MessageType";
import { IMessage } from "./IMessage";
import { TimeoutEvent } from "../Util/TimeoutEvent";
import { Logger } from "../Util/Logger";
import { LogType } from "../Util/LogType";

export abstract class AsyncHandler
{
    private readonly timeout: number = 1000;
    
    private receivedEvent = new TimeoutEvent<number>(this.timeout);
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
                if(message.Index > this.inIndex || this.inIndex === undefined)
                {
                    this.OnMessage(message);
                    this.inIndex = message.Index;
                }
                break;
            case MessageType.Command:
            case MessageType.Player:
            case MessageType.Kick:
            case MessageType.Size:
                this.OnMessage(message);
                break;
            case MessageType.Received:
                this.ParseReceived(message);
                break;
        }

        this.SendMessage(MessageType.Received, message.Index);
        Logger.Log(this, LogType.Verbose, "Message received", message);
    }

    /**
     * Parse incoming ACK.
     * @param index 
     */
    private ParseReceived(message: IMessage)
    {
        this.receivedEvent.Call(message.Payload);
    }

    /**
    * Send a message through the channel.
    * @param type Type of the message.
    * @param payload Payload.
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

           // Create a new ack listener
           const listener = index => 
           {
               if(index === message.Index)
               {
                   this.receivedEvent.Remove(listener);
                   resolve();
               }
               else if(index === null)
               {
                   reject();
               }
           };

           // Add listener and send message
           this.receivedEvent.Add(listener);
           this.channel.SendMessage(JSON.stringify(message));

           Logger.Log(this, LogType.Verbose, "Message sent", message);
       });
   }

   protected abstract OnMessage(message: IMessage): void;
}