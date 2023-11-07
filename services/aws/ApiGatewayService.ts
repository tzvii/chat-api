import * as aws from "aws-sdk";
import { ServiceBase } from "../ServiceBase";
import { ServiceResponse } from "../../models/ServiceResponse";

export class ApiGatewayService extends ServiceBase
{
    private _gateway: aws.ApiGatewayManagementApi;

    constructor ()
    {
        super();
        this._gateway = new aws.ApiGatewayManagementApi({ endpoint: this._config.ConnectionEndpoint });
    }

    public async postToConnection(connectionId: string, message: any): Promise<ServiceResponse<void>>
    {
        try
        {
            const connectionParams = {
                ConnectionId: connectionId,
                Data: Buffer.from(JSON.stringify(message))
            };

            await this._gateway.postToConnection(connectionParams).promise();

            return ServiceResponse.success();
        }
        catch (e)
        {
            this._log.error(e);
            return ServiceResponse.failure(e);
        }
    }

    public async validateConnection(connectionId: string): Promise<ServiceResponse<void>>
    {
        try
        {
            const connectionParams = { ConnectionId: connectionId };
            const response = await this._gateway.getConnection(connectionParams).promise();

            if (!("SourceIp" in response.Identity))
            {
                const err = new Error(`Invalid connection ID: [${connectionId}]`);
                return ServiceResponse.failure(err);
            }

            return ServiceResponse.success();
        }
        catch (e)
        {
            return ServiceResponse.failure(e);
        }
    }
}