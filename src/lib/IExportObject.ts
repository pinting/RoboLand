export interface IExportObject
{
    Name: string | number;
    Class: string;
    Payload: IExportObject | any;
    Args?: any[];
}