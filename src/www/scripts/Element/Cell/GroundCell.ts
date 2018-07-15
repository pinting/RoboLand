import { Coord } from "../../Coord";
import { ElementType } from "../ElementType"
import { BaseCell } from "./BaseCell";

export class GroundCell extends BaseCell
{
    /**
     * Get the type of the cell.
     */
    public GetType(): ElementType
    {
        return ElementType.GroundCell;
    }

    /**
     * Get the size of the cell.
     */
    public GetSize(): Coord
    {
        return new Coord(1.0, 1.0);
    }

    /**
     * Get the texture of the cell.
     */
    public GetTexture(): string
    {
        return "res/ground.png";
    }
}