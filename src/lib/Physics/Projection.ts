export class Projection
{
    public Min: number;
    public Max: number;

    constructor(min: number, max: number) 
    {
        this.Min = min;
        this.Max = max;
    }

    /**
     * Check if the 1D projection overlaps with another one.
     * @param other 
     */
    public Overlap(other: Projection): number
    {
        // This      |------|
        // Other  |------------|
        if(this.Min >= other.Min && this.Max <= other.Max) 
        {
            return this.Max - this.Min;
        }

        // This   |--------|
        // Other     |--------|
        if(this.Min <= other.Min && this.Max <= other.Max && this.Max >= other.Min)
        {
            return this.Max - other.Min;
        }

        // This       |--------|
        // Other   |------|
        if(this.Min >= other.Min && this.Max >= other.Max && this.Min <= other.Max)
        {
            return other.Max - this.Min;
        }

        // This   |---------------|
        // Other     |---------|
        if(this.Min <= other.Min && this.Max >= other.Max)
        {
            return other.Max - other.Min;
        }

        return 0;
    }
}