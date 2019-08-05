import { Vector } from "./Geometry/Vector";

export interface IReadOnlyElementList<Element>
{
    GetLength(): number;
    ForEach(callback: (e: Element) => boolean | void): void;
    Get(id: string): Element;
    Find(position: Vector): Element[];
    FindNearest(position: Vector): Element;
    FindCollisions(unit: Element): Element[];
}