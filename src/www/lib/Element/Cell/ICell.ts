import { IRobot } from "../Robot/IRobot";
import { Coord } from "../../Coord";
import { MoveType } from "../MoveType";
import { IElement } from "../IElement";

export interface ICell extends IElement
{
    MoveHere(robot: IRobot): MoveType;
    MoveAway(): void;
}