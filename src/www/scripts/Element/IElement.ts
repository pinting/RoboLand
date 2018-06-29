import { Coord } from "../Coord";

export interface IElement
{
    GetPosition(): Coord;
    GetTexture(): string;
}