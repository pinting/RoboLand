import { Coord } from "./Coord";

export interface IReadOnlyElementList<Element>
{
    GetLength(): number;
    ForEach(callback: (Element) => boolean | void);
    Get(tag: string): Element;
    Find(id: Coord | string): Element[];
    FindNear(coord: Coord): Element;
    FindBetween(from: Coord, to: Coord): Element[];
}