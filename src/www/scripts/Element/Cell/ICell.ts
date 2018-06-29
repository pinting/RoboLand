import { IActor } from "../Actor/IActor";
import { Coord } from "../../Coord";
import { MoveType } from "../MoveType";
import { IElement } from "../IElement";
import { ElementType } from "../ElementType";

export interface ICell extends IElement
{
    MoveHere(actor: IActor): MoveType;
    MoveAway(actor: IActor): void;
}