import { ElementType } from "./Element/ElementType";

export interface IRawMap
{
    Size: number;
    Actors: Array<{
        X: number;
        Y: number;
        T: ElementType;
    }>;
    Cells: Array<ElementType>;
}