import { ElementType } from "./ElementType";
import { GroundCell } from "./Cell/GroundCell";
import { WaterCell } from "./Cell/WaterCell";
import { PlayerActor } from "./Actor/PlayerActor";
import { Coord } from "../Coord";
import { IElement } from "./IElement";
import { StoneCell } from "./Cell/StoneCell";

export class ElementFactory
{
    /**
     * Create a new IElement based on the given ElementType enum.
     * @param type
     * @param position
     */
    public static FromType(type: ElementType, position: Coord): IElement
    {
        switch(type)
        {
            case ElementType.Null:
                return null;
            
            // Cells
            case ElementType.GroundCell:
                return new GroundCell(position);
            case ElementType.WaterCell:
                return new WaterCell(position);
            case ElementType.StoneCell:
                return new StoneCell(position);
            
            // Actors
            case ElementType.PlayerActor:
                return new PlayerActor(position);
        }
    }
}