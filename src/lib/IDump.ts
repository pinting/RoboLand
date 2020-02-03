export interface IDump
{
    Name: string | number;
    Class: string;
    Payload: IDump | any;
    Base?: string;
    Args?: any[];
}