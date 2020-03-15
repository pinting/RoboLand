import { IChannel } from "./Channel/IChannel";
import { MessageType } from "./MessageType";
import { IMessage } from "./IMessage";
import { Event } from "../Util/Event";
import { Logger } from "../Util/Logger";
import { Tools } from "../Util/Tools";

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
        this.channel.OnMessage = (message: ArrayBuffer) => this.ParseMessage(message);
    }

    /**
     * Receive a message through the channel.
     * @param merged 
     */
    private ParseMessage(merged: ArrayBuffer): void
    {
        const endOfMeta = Tools.FindEndOfMeta(merged);
        const rawMessage = merged.slice(0, endOfMeta);
        const message = JSON.parse(Tools.ANSIToUTF16(rawMessage)) as IMessage;
        const buffer = merged.slice(endOfMeta, merged.byteLength);

        switch(message.Type)
        {
            case MessageType.Diff:
                // Receive only states newer than the current one
                if(message.Index > this.inIndex || this.inIndex === undefined)
                {
                    this.inIndex = message.Index;
                    this.OnMessage(message, buffer);
                }

                this.SendReceived(message);
                break;
            case MessageType.Unit:
            case MessageType.Command:
            case MessageType.Player:
            case MessageType.Kick:
            case MessageType.Resources:
            case MessageType.World:
                this.OnMessage(message, buffer);
                this.SendReceived(message);
                break;
            case MessageType.Received:
                this.ParseReceived(message);
                break;
        }

        Logger.Debug(this, "Message was received", message, buffer);
    }

    /**
     * Parse incoming ACK.
     * @param message 
     */
    private ParseReceived(message: IMessage)
    {
        const index = message.Payload as number;

        this.receivedEvent.Call(index);
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
               Index: this.outIndex++
           };

           let buffer: ArrayBuffer;

           if(payload instanceof ArrayBuffer)
           {
               buffer = payload;
           }
           else
           {
               message.Payload = payload;
           }

           const charArray = Tools.UTF16ToANSI(JSON.stringify(message));
           const slices = [charArray];

           if(buffer)
           {
               slices.push(buffer);
           }

           const merged = Tools.MergeBuffers(slices);

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
           this.channel.SendMessage(merged);

           Logger.Debug(this, "Message was sent", message);
       });
   }

   protected abstract OnMessage(message: IMessage, buffer: ArrayBuffer): void;
}