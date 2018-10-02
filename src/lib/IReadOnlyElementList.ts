import { Coord } from "./Coord";

export interface IReadOnlyElementList<Element>
{
    GetLength(): number;
    ForEach(callback: (Element) => boolean | void);
    Get(id: string): Element;
    Find(coord: Coord): Element[];
    FindNear(coord: Coord): Element;
    FindBetween(from: Coord, to: Coord): Element[];
}