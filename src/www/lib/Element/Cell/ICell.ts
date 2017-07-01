import { IRobot } from "../Robot/IRobot";
import { Coord } from "../../Coord";
import { Movement } from "../Movement";
import { IElement } from "../IElement";

export interface ICell extends IElement
{
    MoveHere(robot: IRobot): Movement;
    MoveAway(): void;
}