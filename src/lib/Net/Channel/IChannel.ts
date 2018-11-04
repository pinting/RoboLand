export interface IChannel
{
    OnMessage(message: string): void;
    SendMessage(message: string): void;
    Close(): void;
}