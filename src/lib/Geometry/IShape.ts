import { ICollison } from "./ICollision";
import { Vector } from "./Vector";
import { IMTVector } from "./IMTVector";

export interface IShape
{
    Collide(other: IShape): IMTVector;
    GetPenetration(other: IShape): ICollison;
    Add(v: Vector): IShape
    Rotate(r: number, c: Vector): IShape
}