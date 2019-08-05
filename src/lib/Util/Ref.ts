export class Ref<T>
{
    private holder: T;

    public Set(value: T)
    {
        this.holder = value;
    }

    public Get(): T
    {
        return this.holder;
    }
}