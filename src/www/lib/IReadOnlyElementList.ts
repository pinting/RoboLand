import { Coord } from "./Coord";

export interface IReadOnlyElementList<Element>
{
    GetLength(): number;
    ForEach(callback: (Element) => boolean | void);
    Tag(tag: string): Element;
    Get(id: Coord | string): Element[];
    GetNear(coord: Coord): Element;
    GetBetween(from: Coord, to: Coord): Element[];
}