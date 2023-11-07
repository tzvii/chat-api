import { App } from './app';

export async function handler(event: any): Promise<any>
{
    const app = new App();

    try
    {
        const response = await app.run(event);
        
        if (response && response?.error !== null)
        {
            console.log("Event:", event);
            console.error(response.error.message);
            return;
        }

        return {
            statusCode: 200,
            body: "Process finished.",
        };
    }
    catch (e)
    {
        console.error(e);
    }
}