import { MessageType } from "./MessageType";

export interface IMessageOut
{
    Type: MessageType;
    Index: number;
    Payload: any;
}