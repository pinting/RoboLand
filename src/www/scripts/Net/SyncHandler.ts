import { AsyncHandler } from "./AsyncHandler";
import { MessageType } from "./MessageType";

export abstract class SyncHandler extends AsyncHandler
{
    private executing: boolean = false;
    private queue: {
        Type: MessageType,
        Resolve: Function,
        Payload: any
    }[] = [];

    private async ExecuteQueue(): Promise<void>
    {
        if(this.executing)
        {
            return;
        }

        this.executing = true;

        while(this.queue.length)
        {
            const element = this.queue.shift();

            await super.SendMessage(element.Type, element.Payload);

            element.Resolve();
        }

        this.executing = false;
    }

    protected SendMessage(type: MessageType, payload: any): Promise<void>
    {
        return new Promise(resolve =>
        {
            this.queue.push({
                Type: type,
                Resolve: resolve,
                Payload: payload
            });

            this.ExecuteQueue();
        });
    }
}