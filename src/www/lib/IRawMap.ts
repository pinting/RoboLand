export interface IRawMap
{
    Size: {
        X: number;
        Y: number;
    };
    Actors: Array<{
        X: number;
        Y: number;
        Class: string
    }>;
    Cells: Array<{
        X: number;
        Y: number;
        Class: string
    }>;
}