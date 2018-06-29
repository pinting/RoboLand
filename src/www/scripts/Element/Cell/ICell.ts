import { IActor } from "../Actor/IActor";
import { Coord } from "../../Coord";
import { MoveType } from "../MoveType";
import { IElement } from "../IElement";
import { CellType } from "./CellType";

export interface ICell extends IElement
{
    GetType(): CellType;
    MoveHere(actor: IActor): MoveType;
    MoveAway(actor: IActor): void;
}