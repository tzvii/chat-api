import * as moment from 'moment';
import * as crypto from 'crypto';
import { ServiceBase } from "./ServiceBase";
import { ApiGatewayService } from "./aws/ApiGatewayService";
import { DynamoDBService } from "./aws/DynamoDBService";
import { IPutItemInput } from "./aws/IDynamoDBService";
import { ServiceResponse } from '../models/ServiceResponse';
import { User, UsersService } from './UsersService';

export class MessagingService extends ServiceBase
{
    private _gatewayService: ApiGatewayService;
    private _dynamoService: DynamoDBService;
    private _usersService: UsersService;

    constructor(gatewayService: ApiGatewayService, dynamoService: DynamoDBService, usersService: UsersService)
    {
        super();
        this._gatewayService = gatewayService;
        this._dynamoService = dynamoService;
        this._usersService = usersService;
    }

    public async sendMessage(connectionId: string, receiver: string, message: string)
        : Promise<ServiceResponse<void>>
    {
        try
        {
            const userConn = await this._usersService.getUserConnection(connectionId);
            const userItem = userConn.data.item as User;

            const recUser = await this._usersService.getUser(receiver);
            const recUserItem = recUser.data.item as User;

            const sentResp = await this._gatewayService.postToConnection(
                recUserItem.connection_id, 
                `[${userItem.user_id}]: ${message}`
            );
            if (!sentResp.isSuccess)
            {
                this._log.error(sentResp.error.message);
                return sentResp;
            }

            const savedResp = await this.insertMessage(connectionId, receiver, message);
            if (!savedResp.isSuccess)
            {
                this._log.error(savedResp.error.message);
                return savedResp;
            }

            return ServiceResponse.success();
        }
        catch (e)
        {
            this._log.error(`Failed to send message: ${e}`);
            return ServiceResponse.failure(e);
        }
    }

    public async broadcastMessage(message: string): Promise<ServiceResponse<void>>
    {
        try
        {
            const connectionIdsResp = await this._usersService.getConnectionIds();
            if (!connectionIdsResp.isSuccess)
            {
                const err = `Failed to broadcast message: '${message}'`
                this._log.error(err);
                return ServiceResponse.failure(new Error(err));
            }
            
            const connectionIds = connectionIdsResp.data as string[];
            const promiseArray: any[] = connectionIds.map(id => this._gatewayService.postToConnection(id, message));
            await Promise.all(promiseArray);

            return ServiceResponse.success();
        }
        catch (e)
        {
            this._log.error(`Failed to broadcast message: ${e}`);
            return ServiceResponse.failure(e);
        }
    }

    public async insertMessage(connectionId: string, receiver: string, message: string)
        : Promise<ServiceResponse<void>>
    {
        try 
        {
            const messageId = crypto.randomUUID();
            const currentTime = moment();
            const duration = this.getDuration(this._config.ChatMessageExpiration);

            const awsParams: IPutItemInput =
            {
                tableName: this._config.ChatMessagesTable,
                item: {
                    message_id: messageId,
                    connection_id: connectionId,
                    receiver: receiver,
                    message: message,
                    created_at: currentTime.format(),
                    time_to_live: currentTime.add(duration).unix()                
                } as Message
            };

            const inserted = await this._dynamoService.put(awsParams);
            if (!inserted.isSuccess)
                this._log.error(`Failed to insert message [${awsParams}].`);

            return inserted;
        }
        catch (e)
        {
            this._log.error(e);
            return ServiceResponse.failure(e);
        }
    }

    // TODO
    public async viewMessages(connectionId: string, username: string): Promise<any>
    {
        // View messages for current connection => priority key (connectionId, username)
        // Maybe store session messages into an array...
        // It might be easier to use MySQL
        // Use GSI (global secondary index)
    }

    // TODO
    public async deleteMessage(): Promise<any>
    {

    }
}

export type Message =
{
    message_id: string,
    connection_id: string,
    receiver: string,
    message: string,
    created_at: string,
    time_to_live: number
}