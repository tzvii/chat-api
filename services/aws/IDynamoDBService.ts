import { DynamoDB } from "aws-sdk";
import { ServiceResponse } from "../../models/ServiceResponse";

export interface IDynamoDbService
{
    get(params: IGetItemInput): Promise<ServiceResponse<IGetItemOutput>>;
    put(params: IPutItemInput): Promise<boolean>;
    remove(params: IRemoveItemInput): Promise<boolean>;
    update(params: IUpdateItemInput): Promise<boolean>;
}

export type ReturnValue = 'NONE' | 'ALL_OLD' | 'UPDATED_OLD' | 'ALL_NEW' | 'UPDATED_NEW';
export type TransactionOperation = 'ConditionCheck' | 'Put' | 'Delete' | 'Update';
export type PrimaryKey = { [primaryKey: string]: any };
export type AttributeMap = { [key: string]: any };

/**
 * @param {string} tableName - The name of the table containing the requested item.
 * @param {PrimaryKey} key - A map representing the primary key of the item to retrieve
 */
export interface IGetItemInput
{
    tableName: string;
    key: PrimaryKey;
}

/**
 * @param {AttributeMap} item - A map of attribute names to AttributeValue objects,
 * as specified by ProjectionExpression.
 */
export interface IGetItemOutput
{
    item?: AttributeMap;
}

/**
 * @param {string} tableName - The name of the table to contain the item.
 * @param {AttributeMap} item - A map of attribute name/value pairs, one for each attribute.
 * @param {string} conditionExpression - A condition that must be satisfied in order for a
 * conditional PutItem operation to succeed.
 * @param {ReturnValue} returnValues - Use ReturnValues if you want to get the item attributes
 * as they appeared before they were updated with the PutItem request.
 */
export interface IPutItemInput
{
    tableName: string;
    item: AttributeMap;
    conditionExpression?: string;
    returnValues?: ReturnValue;
}

/**
 * @param {AttributeMap} attributes - The attribute values as they appeared before the PutItem operation,
 * but only if ReturnValues is specified as ALL_OLD in the request.
 */
export interface IPutItemOutput
{
    attributes?: AttributeMap;
    
}

/**
 * @param {string} tableName - The name of the table from which to delete the item.
 * @param {AttributeMap} key - A map of attribute names to AttributeValue objects,
 * representing the primary key of the item to delete.
 * @param {ReturnValue} returnValues - Use returnValues if you want to get the item
 * attributes as they appeared before they were deleted.
 */
export interface IRemoveItemInput
{
    tableName: string;
    key: AttributeMap;
    returnValues?: ReturnValue;
}

/**
 * @param {string} tableName - The name of the table containing the requested item.
 * @param {PrimaryKey} key - A map representing the primary key of the item to retrieve
 * @param {AttributeMap} item - A map of attribute names to AttributeValue values
 */
export interface IUpdateItemInput
{
    tableName: string;
    key: PrimaryKey;
    item?: AttributeMap;
    returnValues?: ReturnValue;
}

export type TransactionWriteInput = ITransactionPutItemInput | ITransactionRemoveItemInput;
export type TransactionWriteInputFull = ITransactionPutItemInput & ITransactionRemoveItemInput;

/**
 * @param {TransactionOperation} - The operation used for the transaction write
 * @param {string} tableName - The name of the table to contain the item.
 * @param {AttributeMap} item - A map of attribute name/value pairs, one for each attribute.
 * @param {string} conditionExpression - A condition that must be satisfied in order for a
 * conditional PutItem operation to succeed.
 */
export interface ITransactionPutItemInput
{
    operation: TransactionOperation;
    tableName: string;
    item: AttributeMap;
    conditionExpression?: string;
    returnValuesOnConditionCheckFailure?: string;
}

/**
 * @param {TransactionOperation} - The operation used for the transaction write
 * @param {string} tableName - The name of the table from which to delete the item.
 * @param {AttributeMap} key - A map of attribute names to AttributeValue objects,
 * representing the primary key of the item to delete.
 * @param {ReturnValue} returnValues - Use returnValues if you want to get the item
 * attributes as they appeared before they were deleted.
 */
export interface ITransactionRemoveItemInput
{
    operation: TransactionOperation;
    tableName: string;
    key: AttributeMap;
    returnValues?: ReturnValue;
}
