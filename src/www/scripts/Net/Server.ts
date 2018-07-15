import { IClient } from "./IClient";
import { MessageType } from "./MessageType";
import { Map } from "../Map";
import { BaseElement } from "../Element/BaseElement";

export class Server
{
    private readonly map: Map;
    private readonly clients: IClient[] = [];

    private mapUrl: string;

    public constructor(mapUrl: string)
    {
        this.mapUrl = mapUrl;
        this.map = new Map();

        this.map.OnUpdate = element => this.SendElement(element);
        this.map.Load(mapUrl);
    }

    private OnMessage(id: string, type: MessageType, payload: string)
    {
        if(type == MessageType.Init) {
            // TODO: Kick the client!
            return;
        }

        // TODO
    }

    private SendElement(element: BaseElement)
    {
        const type = element.IsDisposed() ? MessageType.Set : MessageType.Remove;
        const payload = element.Export();

        this.clients.forEach(client => 
        {
            client.SendMessage(type, payload);
        });
    }
    
    public Add(client: IClient)
    {
        client.OnMessage = (type, payload) =>
        {
            this.OnMessage(client.GetId(), type, payload);
        };

        client.SendMessage(MessageType.Init, this.map.GetSize().Export());
    }
}