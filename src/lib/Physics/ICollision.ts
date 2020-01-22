import { IContact } from "../Geometry/IContact";
import { Body } from "./Body";

export interface ICollision extends IContact
{
    A: Body;
    B: Body;
}