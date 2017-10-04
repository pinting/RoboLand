import { ICell } from "./ICell";
import { CellType } from "./CellType";
import { GroundCell } from "./GroundCell";
import { WaterCell } from "./WaterCell";
import { Coord } from "../../Coord";

export class CellFactory
{
    /**
     * Create a new ICell based on the given CellType enum.
     * @param type
     * @param position
     */
    public static FromType(type: CellType, position: Coord): ICell
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