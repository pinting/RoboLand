import { MessageType } from "./MessageType";

export interface IClient
{
    GetId(): string;
    OnMessage(type: MessageType, payload: string);
    SendMessage(type: MessageType, payload: string);
}