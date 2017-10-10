export interface IBlock
{
    a: string | IBlock;
    m: "*" | "/" | "+" | "-";
    b: string | IBlock;
}