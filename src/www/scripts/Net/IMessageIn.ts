import { MessageType } from "./MessageType";

export interface IMessageIn
{
    Type: MessageType;
    Payload: any;
}