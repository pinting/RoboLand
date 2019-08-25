import { Vector } from "./Vector";

export interface ICollison
{
    Penetration: number;
    Normal: Vector;
    Contacts: Vector[];
    ContactCount: number;
}