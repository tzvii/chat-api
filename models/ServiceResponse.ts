export class ServiceResponse<T> 
{
	public data: T | null;
	public error: Error | null;
    public isSuccess: boolean;

	constructor(data: T | null, error: Error | null, success: boolean) 
    {
		this.data = data;
		this.error = error;
        this.isSuccess = success;
	}

	static success<T>(data?: T): ServiceResponse<T> 
    {
		return new ServiceResponse<T>(data, null, true);
	}

	static failure<T>(error: Error): ServiceResponse<T> 
    {
		return new ServiceResponse<T>(null, error, false);
	}
}