import * as moment from 'moment';
import { ServiceBase } from "./ServiceBase";
import { DynamoDBService } from "./aws/DynamoDBService";
import { ServiceResponse } from '../models/ServiceResponse';
import { IGetItemInput, IGetItemOutput, TransactionWriteInput } from './aws/IDynamoDBService';
import { DynamoTransactionOperations } from '../maps/DynamoTransactionOperations';

export class UsersService extends ServiceBase
{
    private _dynamoService: DynamoDBService;

    constructor(dynamoService: DynamoDBService)
    {
        super();
        this._dynamoService = dynamoService;
    }

    public async insertUser(username: string, connectionId: string): Promise<ServiceResponse<void>>
    {
        try
        {
            const currentTime = moment();
            const duration = this.getDuration(this._config.ChatUserExpiration);

            const transactionParams: TransactionWriteInput[] = 
            [
                {
                    operation: DynamoTransactionOperations.Put,
                    tableName: this._config.ActiveChatUsersTable,
                    item: {
                        user_id: username,
                        connection_id: connectionId,
                        created_at: currentTime.format(),
                        time_to_live: currentTime.add(duration).unix()
                    } as User,
                    conditionExpression: `attribute_not_exists(user_id)`,
                    returnValuesOnConditionCheckFailure: 'ALL_OLD'
                },
                {
                    operation: DynamoTransactionOperations.Put,
                    tableName: this._config.ActiveConnectionIdsTable,
                    item: {
                        connection_id: connectionId,
                        user_id: username,
                        created_at: currentTime.format(),
                        time_to_live: currentTime.add(duration).unix()
                    } as User,
                    conditionExpression: `attribute_not_exists(connection_id)`,
                    returnValuesOnConditionCheckFailure: 'ALL_OLD'
                }
            ];
            
            const inserted = await this._dynamoService.transactWrite(transactionParams);
            if (!inserted.isSuccess)
                this._log.error(`Failed to insert user '${username}'.`);

            return inserted;
        }
        catch (e)
        {
            this._log.error(`Failed to insert user: ${e}`);
            return ServiceResponse.failure(e);
        }
    }

    public async getUser(userId: string): Promise<ServiceResponse<IGetItemOutput>>
    {
        try
        {
            const getParams: IGetItemInput =
            {
                tableName: this._config.ActiveChatUsersTable,
                key: { user_id: userId }
            };

            const user = await this._dynamoService.get(getParams);
            if (!user.isSuccess)
            {
                this._log.error(`Failed to get user with ID '${userId}'.`);
                return user;
            }

            return ServiceResponse.success(user.data);
        }
        catch (e)
        {
            this._log.error(`Failed to get user: ${e}.`);
            return ServiceResponse.failure(e);
        }
    }

    public async getUserConnection(connectionId: string): Promise<ServiceResponse<IGetItemOutput>>
    {
        try
        {
            const getParams: IGetItemInput =
            {
                tableName: this._config.ActiveConnectionIdsTable,
                key: { connection_id: connectionId }
            };

            const user = await this._dynamoService.get(getParams);
            if (!user.isSuccess)
            {
                this._log.error(`Failed to get user connection with ID '${connectionId}'.`);
                return user;
            }

            return ServiceResponse.success(user.data);
        }
        catch (e)
        {
            this._log.error(`Failed to get user connection: ${e}`);
            return ServiceResponse.failure(e);
        }
    }

    public async getUsernames(): Promise<ServiceResponse<any[] | void>>
    {
        try
        {
            const colResp = await this._dynamoService.getColumnValues(
                this._config.ActiveChatUsersTable, 
                'user_id'
            );
            if (!colResp.isSuccess)
            {
                this._log.error(`Failed to retrieve usernames from '${this._config.ActiveChatUsersTable}' table.`);
                return colResp;
            }

            return ServiceResponse.success(colResp.data);
        }
        catch (e)
        {
            this._log.error(`Failed to get usernames: ${e}`);
            return ServiceResponse.failure(e);
        }
    }

    public async getConnectionIds(): Promise<ServiceResponse<any[] | void>>
    {
        try
        {
            const colResp = await this._dynamoService.getColumnValues(
                this._config.ActiveConnectionIdsTable, 
                'connection_id'
            );
            if (!colResp.isSuccess)
            {
                this._log.error(`Failed to retrieve connection IDs from '${this._config.ActiveConnectionIdsTable}' table.`);
                return colResp;
            }

            return ServiceResponse.success(colResp.data);
        }
        catch (e)
        {
            this._log.error(`Failed to get connection IDs: ${e}`);
            return ServiceResponse.failure(e);
        }
    }

    public async removeUser(connectionId: string): Promise<ServiceResponse<{ userId: string } | void>>
    {
        try
        {
            const userConn: ServiceResponse<IGetItemOutput> = await this.getUserConnection(connectionId);
            const userItem = userConn.data.item as User;

            const transactionParams: TransactionWriteInput[] = 
            [
                {
                    operation: DynamoTransactionOperations.Delete,
                    tableName: this._config.ActiveChatUsersTable,
                    key: { user_id: userItem.user_id }
                },
                {
                    operation: DynamoTransactionOperations.Delete,
                    tableName: this._config.ActiveConnectionIdsTable,
                    key: { connection_id: connectionId }
                }
            ];

            const deleted = await this._dynamoService.transactWrite(transactionParams);
            if (!deleted.isSuccess)
            {
                this._log.error(`Failed to delete user '${userItem.user_id}' with connection ID '${connectionId}'.`);
                return deleted;
            }

            return ServiceResponse.success({ userId: userItem.user_id });
        }
        catch (e)
        {
            this._log.error(e);
            return ServiceResponse.failure(e);
        }
    }
}

export type User =
{
    user_id: string,
    connection_id: string,
    created_at: string,
    time_to_live: number
}