export interface IExportable
{
    Export(): string;
    Import(input: string): boolean;
}