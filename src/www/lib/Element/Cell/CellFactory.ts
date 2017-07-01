import { ICell } from "./ICell";
import { CellType } from "./CellType";
import { GroundCell } from "./GroundCell";
import { WaterCell } from "./WaterCell";
import { Coord } from "../../Coord";

export class CellFactory
{
    public static Factory(type: CellType, position: Coord): ICell
    {
        switch(type)
        {
            case CellType.Ground:
                return new GroundCell(position);
            case CellType.Water:
                return new WaterCell(position);
        }
    }
}