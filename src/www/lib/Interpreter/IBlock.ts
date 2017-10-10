export interface IBlock
{
    left: string | IBlock;
    right: string | IBlock;
    method: "*" | "/" | "+" | "-";
}