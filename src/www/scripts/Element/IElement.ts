import { Coord } from "../Coord";
import { ElementType } from "./ElementType";

export interface IElement
{
    GetType(): ElementType;
    GetPos(): Coord;
    GetSize(): Coord;
    GetTexture(): string;
}