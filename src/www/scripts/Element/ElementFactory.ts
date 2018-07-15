import { ElementType } from "./ElementType";
import { Coord } from "../Coord";
import { BaseElement } from "./BaseElement";
import { GroundCell } from "./Cell/GroundCell";
import { WaterCell } from "./Cell/WaterCell";
import { StoneCell } from "./Cell/StoneCell";
import { PlayerActor } from "./Actor/PlayerActor";

export class ElementFactory
{
    /**
     * Create a new BaseElement based on the given ElementType enum.
     * @param type
     * @param position
     */
    public static FromType(type: ElementType, position: Coord): BaseElement
    {
        switch(type)
        {   
            // Cells
            case ElementType.Null:
                return null;
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

    /**
     * Check if the given ElementType is an actor.
     * @param type 
     */
    public static IsActor(type: ElementType): boolean
    {
        return type < ElementType.Null;
    }

    /**
     * Check if the given ElementType is a cell.
     * @param type 
     */
    public static IsCell(type: ElementType): boolean
    {
        return type >= ElementType.Null;
    }
}