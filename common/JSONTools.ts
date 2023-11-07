export class JSONTools
{
    public static parse<T>(str: string): T | null
    {
        let result: T | null = null;
        try
        {
            result = JSON.parse(str);
        }
        catch (e)
        {
            console.error(`Error parsing string: ${str}`, e);
        }

        return result;
    }

    public static stringify(entity: JSON | {}): string | null
    {
        let result: string | null = null;
        try
        {
            result = JSON.stringify(entity);
        }
        catch (e)
        {
            console.error(`Error stringifying entity: ${entity}`, e);
        }

        return result;
    }
}