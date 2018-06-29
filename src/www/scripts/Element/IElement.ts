import { Coord } from "../Coord";
import { ElementType } from "./ElementType";

export interface IElement
{
    GetType(): ElementType;
    GetPosition(): Coord;
    GetTexture(): string;
}