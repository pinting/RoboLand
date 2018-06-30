import { Coord } from "../../Coord";
import { IElement } from "../IElement";

export interface IActor extends IElement
{
    Move(direction: Coord): boolean
    Attack(actor: IActor): boolean
    Damage(damage: number): void
    IsAlive(): boolean;
}