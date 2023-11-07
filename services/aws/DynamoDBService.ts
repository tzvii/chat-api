import { DynamoDB } from 'aws-sdk';
import { AttributeMap, IGetItemInput, IGetItemOutput, IPutItemInput, IRemoveItemInput, ITransactionPutItemInput, ITransactionRemoveItemInput, IUpdateItemInput, TransactionWriteInput, TransactionWriteInputFull } from './IDynamoDBService';
import { DocumentClient, TransactWriteItem, TransactWriteItemsInput } from 'aws-sdk/clients/dynamodb';
import { ServiceResponse } from '../../models/ServiceResponse';
import { ServiceBase } from '../ServiceBase';
import { DynamoTransactionOperations } from '../../maps/DynamoTransactionOperations';

export class DynamoDBService extends ServiceBase
{
    private _documentClient: DocumentClient;

    constructor()
    {
        super();
    }

    private async createDocumentClient(): Promise<DocumentClient>
    {
        const dynamoDbConfig: DocumentClient.DocumentClientOptions &
            DynamoDB.Types.ClientConfiguration =
        {
            region: this._config.AwsRegion,
            apiVersion: '2012-08-10'
        };

        this._documentClient = new DynamoDB.DocumentClient(dynamoDbConfig);

        return this._documentClient;
    }

    private async getDocumentClient(): Promise<DocumentClient>
    {
        if (this._documentClient)
            return this._documentClient;

        const docClient = await this.createDocumentClient();

        return docClient;
    }

    public async get(params: IGetItemInput): Promise<ServiceResponse<IGetItemOutput>>
    {
        try
        {
            const docClient = await this.getDocumentClient();

            const awsParams: DocumentClient.GetItemInput = {
                TableName: params.tableName,
                Key: params.key
            };

            const entry = await docClient.get(awsParams).promise();

            return ServiceResponse.success({ item: entry.Item });
        }
        catch (e)
        {
            return ServiceResponse.failure(e);
        }
    }

    public async put(params: IPutItemInput): Promise<ServiceResponse<any>>
    {
        try
        {
            const docClient = await this.getDocumentClient();

            const awsParams: DocumentClient.PutItemInput = {
                TableName: params.tableName,
                Item: params.item,
                ConditionExpression: params.conditionExpression,
                ReturnValues: params.returnValues
            };

            const putItemDdbResp = await docClient.put(awsParams).promise();
            if (putItemDdbResp.$response.error)
            {
                this._log.error(putItemDdbResp.$response.error)
                return ServiceResponse.failure(putItemDdbResp.$response.error); 
            }

            return ServiceResponse.success();
        }
        catch (e)
        {
            this._log.error(e);
            return ServiceResponse.failure(e); 
        }
    }

    public async remove(params: IRemoveItemInput): Promise<ServiceResponse<any>>
    {
        try
        {
            const docClient = await this.getDocumentClient();

            const awsParams: DocumentClient.DeleteItemInput = {
                TableName: params.tableName,
                Key: params.key
            };

            const removedResp = await docClient.delete(awsParams).promise();
            if (removedResp.$response.error)
            {
                this._log.error(removedResp.$response.error);
                return ServiceResponse.failure(removedResp.$response.error);
            }

            return ServiceResponse.success();
        }
        catch (e)
        {
            this._log.error(e);
            return ServiceResponse.failure(e); 
        }
    }

    public async update(params: IUpdateItemInput): Promise<ServiceResponse<void>>
    {
        try
        {
            const docClient = await this.getDocumentClient();

            const awsParams: DocumentClient.UpdateItemInput = {
                TableName: params.tableName,
                Key: params.key,
                UpdateExpression: this.buildUpdateExpression(params.item),
                ExpressionAttributeNames: this.buildExpressionAttributeNames(params.item),
                ExpressionAttributeValues: this.buildExpressionAttributeValues(params.item)
            };

            const updateItemResp = await docClient.update(awsParams).promise();
            if (updateItemResp.$response.error)
            {
                this._log.error(updateItemResp.$response.error);
                return ServiceResponse.failure(updateItemResp.$response.error);
            }

            return ServiceResponse.success();
        }
        catch (e)
        {
            this._log.error(e);
            return ServiceResponse.failure(e); 
        }
    }

    private buildUpdateExpression(data: { [key: string]: any }): string
    {
        const expressions =  Object.keys(data).map((key) => `#${key} = :${key}`);
        return `SET ${expressions.join(', ')}`;
    }
      
    private buildExpressionAttributeValues(data: { [key: string]: any }): {}
    {
        return Object.keys(data).reduce((acc, key) => {
            acc[`:${key}`] = data[key];
            return acc;
        }, {});
    }

    private buildExpressionAttributeNames(data: { [key: string]: any }): {}
    {
        return Object.keys(data).reduce((acc, key) => {
            acc[`#${key}`] = key;
            return acc;
        }, {});
    }

    public async transactWrite(transInputList: TransactionWriteInput[] | TransactionWriteInputFull[])
        : Promise<ServiceResponse<void>>
    {        
        try
        {
            const docClient = await this.getDocumentClient();

            const transWriteList: DocumentClient.TransactWriteItemList = transInputList.map(transInput => 
                {
                    switch(transInput.operation)
                    {
                        case DynamoTransactionOperations.Put:
                            return this.createPutTransaction(transInput);
                        case DynamoTransactionOperations.Delete:
                            return this.createRemoveTransaction(transInput);
                    }
                });

            const awsParams: DocumentClient.TransactWriteItemsInput =
            {
                TransactItems: transWriteList
            };

            const transResp = await docClient.transactWrite(awsParams).promise();
            if (transResp.$response.error)
            {
                this._log.error(transResp.$response.error);
                return ServiceResponse.failure(transResp.$response.error); 
            }

            return ServiceResponse.success();
        }
        catch (e)
        {
            this._log.error(e);
            return ServiceResponse.failure(e); 
        }
    }

    private createPutTransaction(putTransaction: ITransactionPutItemInput): TransactWriteItem
    {
        return {
            [DynamoTransactionOperations.Put]: {
                TableName: putTransaction.tableName,
                Item: putTransaction.item,
                ConditionExpression: putTransaction.conditionExpression,
                ReturnValuesOnConditionCheckFailure: putTransaction.returnValuesOnConditionCheckFailure
            }
        };
    }

    private createRemoveTransaction(removeTransaction: ITransactionRemoveItemInput): TransactWriteItem
    {
        return {
            [DynamoTransactionOperations.Delete]: {
                TableName: removeTransaction.tableName,
                Key: removeTransaction.key
            }
        };
    }

    public async getColumnValues(table: string, column: string): Promise<ServiceResponse<any[]>>
    {
        try
        {
            const docClient = await this.getDocumentClient();
            
            const awsParams: DocumentClient.ScanInput = {
                TableName: table,
                ProjectionExpression: column,
            };
            
            const scanResponse = await docClient.scan(awsParams).promise();
            if (scanResponse.$response.error)
            {
                this._log.error("Failed to retrieve column values:", scanResponse.$response.error)
                return ServiceResponse.failure(scanResponse.$response.error); 
            }

            const colArray = scanResponse.Items.map(item => item[column]);
            return ServiceResponse.success(colArray);
            
        }
        catch (e)
        {
            this._log.error(`Failed to get column values: ${e}`);
            return ServiceResponse.failure(e);
        }
    }
}