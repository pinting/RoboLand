import { Vector } from "./Vector";

export interface IContact
{
    Penetration: number;
    Normal: Vector;
    Points: Vector[];
}