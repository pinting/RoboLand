export interface IMessage
{
    type: string;

    // For type == "init"
    code?: string[];
    labels?: { [id: string] : number; };
    speed?: number;

    // For type == "result"
    name: string;
    result?: any;
}