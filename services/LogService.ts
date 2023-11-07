
export class LogService
{
    public info(msg: string, ...optParams: any[]): void
    {
        console.log(msg, ...optParams);
    }
    
    public error(error: any, ...optParams: any[]): void
    {
        console.error(error, ...optParams);
    }

    public warn(msg: string, ...optParams: any[]): void
    {
        console.warn(msg, ...optParams);
    }

    public table(msg: string, ...optParams: any[]): void
    {
        console.table(msg, ...optParams);
    }
}