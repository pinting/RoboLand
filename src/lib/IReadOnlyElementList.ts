import { Vector } from "./Physics/Vector";
import { Mesh } from "./Physics/Mesh";

export interface IReadOnlyElementList<Element>
{
    GetLength(): number;
    ForEach(callback: (Element) => boolean | void): void;
    Get(id: string): Element;
    Find(vector: Vector): Element[];
    FindNear(vector: Vector): Element;
    FindAround(mesh: Mesh): Element[];
}