import { ElementType } from "./Element/ElementType";

export interface IRawMap
{
    Size: {
        X: number;
        Y: number;
    };
    Actors: Array<{
        X: number;
        Y: number;
        Type: ElementType;
        Tag?: string;
    }>;
    Cells: Array<ElementType>;
}