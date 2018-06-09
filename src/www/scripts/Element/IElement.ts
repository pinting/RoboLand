import { Coord } from "../Coord";

export interface IElement
{
    GetTexture(): string;
    GetPosition(): Coord;
}