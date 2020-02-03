import { Vector } from "./Geometry/Vector";

export interface IReadOnlyUnitList<U>
{
    GetLength(): number;
    Some(callback: (e: U) => boolean | void): void;
    Get(id: string): U;
    Find(position: Vector): U[];
    FindNearest(position: Vector): U;
    FindCollisions(unit: U): U[];
    GetArray(): U[];
}