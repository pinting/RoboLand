import { Vector } from "./Vector";
import { Body } from "../Physics/Body";

export interface IContact
{
    Penetration: number;
    Normal: Vector;
    Points: Vector[];
}