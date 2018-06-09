import { Coord } from "../../Coord";
import { IElement } from "../IElement";

export interface IRobot extends IElement
{
    Move(direction: Coord): boolean
    Attack(robot: IRobot): boolean
    Damage(damage: number): void
    IsAlive(): boolean;
}