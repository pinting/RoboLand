export interface IChannel
{
    OnMessage(message: ArrayBuffer): void;
    SendMessage(message: ArrayBuffer): void;
    Close(): void;
}