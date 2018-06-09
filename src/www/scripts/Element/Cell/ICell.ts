import { IRobot } from "../Robot/IRobot";
import { Coord } from "../../Coord";
import { MoveType } from "../MoveType";
import { IElement } from "../IElement";
import { CellType } from "./CellType";

export interface ICell extends IElement
{
    GetType(): CellType;
    MoveHere(robot: IRobot): MoveType;
    MoveAway(): void;
}