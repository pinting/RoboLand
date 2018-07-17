import { IClient } from "./IClient";
import { MessageType } from "./MessageType";
import { Map } from "../Map";
import { BaseElement } from "../Element/BaseElement";

export class Server
{
    private readonly map: Map;
    private readonly clients: IClient[] = [];

    private mapUrl: string;

    /**
     * TODO
     * @param mapUrl 
     */
    public constructor(mapUrl: string)
    {
        this.mapUrl = mapUrl;
        this.map = new Map();

        this.map.OnUpdate = element => this.SendElement(element);
        this.map.Load(mapUrl);
    }

    /**
     * TODO
     * @param client 
     * @param type 
     * @param payload 
     */
    private OnMessage(client: IClient, type: MessageType, payload: string)
    {
        // TODO
    }

    /**
     * TODO
     * @param element 
     */
    private SendElement(element: BaseElement)
    {
        const type = element.IsDisposed() ? MessageType.Set : MessageType.Remove;
        const payload = JSON.stringify(element.ExportAll());

        this.clients.forEach(client => 
        {
            client.SendMessage(type, payload);
        });
    }
    
    /**
     * TODO
     * @param client 
     */
    public Add(client: IClient)
    {
        client.OnMessage = (type, payload) => this.OnMessage(client, type, payload);

        const payload = JSON.stringify(this.map.GetSize().ExportAll());

        client.SendMessage(MessageType.Init, payload);
    }
}