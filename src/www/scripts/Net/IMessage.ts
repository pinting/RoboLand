import { MessageType } from "./MessageType";

export interface IMessage
{
    Type: MessageType;
    Index: number;
    Payload: any;
}