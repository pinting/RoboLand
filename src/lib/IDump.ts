export interface IDump
{
    Name: string | number;
    Class: string;
    Payload: IDump | any;
    Args?: any[];
}