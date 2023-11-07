import { JSONTools } from "../common/JSONTools";
import { RouteKey } from "../maps/RouteKeys";
import { ServiceResponse } from "../models/ServiceResponse";
import { ConnectEvent, DisconnectEvent, WebSocketEvent } from "../objects/WebSocketEvents";
import { MessagingService } from "./MessagingService";
import { ServiceBase } from "./ServiceBase";
import { UsersService } from "./UsersService";
import { ApiGatewayService } from "./aws/ApiGatewayService";

export class RoutesService extends ServiceBase
{
    private _gatewayService: ApiGatewayService;
    private _messagingService: MessagingService;
    private _usersService: UsersService;

    constructor(
        gatewayService: ApiGatewayService, 
        messagingService: MessagingService, 
        usersService: UsersService
    ) {
        super();
        this._gatewayService = gatewayService;
        this._messagingService = messagingService;
        this._usersService = usersService;
    }

    public async triggerRoute(event: WebSocketEvent): Promise<any>
    {
        const { routeKey } = event.requestContext;

        let response: any = null;

        switch (routeKey)
        {
            case RouteKey.connect:
                response = await this.connect(event); break;
            case RouteKey.disconnect:
                response = await this.disconnect(event); break;
            case RouteKey.setName:
                response = await this.setName(event); break;
            case RouteKey.sendMessage:
                response = await this.sendMessage(event); break;
            case RouteKey.deleteMessage:
                response = await this.deleteMessage(event); break;
            case RouteKey.viewMessages:
                response = await this.viewMessages(event); break;
            case RouteKey.listUsers:
                response = await this.listActiveUsers(event); break;
            default:
                this._log.error(`Invalid route key: [${routeKey}]`); return;
        }
        
        return response;
    }

    private async connect(event: ConnectEvent): Promise<ServiceResponse<void>>
    {   
        try
        {
            const { connectionId } = event.requestContext;

            this._log.info(`Connection for connection ID ${connectionId} is successful!`);
            return ServiceResponse.success();
        }
        catch (e)
        {
            this._log.error(e);
            return ServiceResponse.failure(e);
        }
    }

    private async disconnect(event: DisconnectEvent): Promise<any>
    {        
        try
        {
            const { connectionId } = event.requestContext;

            const deletedUser = await this._usersService.removeUser(connectionId);
            if (!deletedUser.isSuccess)
            {
                this._log.info(`Failed to disconnect ID [${connectionId}]`);
                return deletedUser;
            }

            await this._messagingService.broadcastMessage(`${deletedUser.data['userId']} has left the chat.`);

            this._log.info(`Successfully disconnected ID [${connectionId}]`);
            return ServiceResponse.success();
        }
        catch (e)
        {
            this._log.error(e);
            return ServiceResponse.failure(e);
        }
    }

    private async setName(event: any): Promise<ServiceResponse<void>> 
    {
        try
        {
            const { username } = JSONTools.parse(event.body) as { username: string };
            const { connectionId } = event.requestContext;

            const userInserted = await this._usersService.insertUser(username, connectionId);
            if (!userInserted.isSuccess)
            {
                this._log.error(`Failed to insert user '${username}' with connection ID '${connectionId}'`);
                return userInserted;
            }

            await this._messagingService.broadcastMessage(`${username} has joined the chat.`);

            return ServiceResponse.success();
        }
        catch (e)
        {
            this._log.error(e);
            return ServiceResponse.failure(e);
        }
    }

    private async sendMessage(event: any): Promise<ServiceResponse<void>>
    {
        try
        {
            const { to: receiver, message } = JSONTools.parse(event.body) as { to: string, message: string };
            const { connectionId } = event.requestContext;

            const messageSent = await this._messagingService.sendMessage(connectionId, receiver, message);
            if (!messageSent.isSuccess)
            {
                this._log.error(`Failed to send message to ${receiver}`);
                return messageSent;
            }

            return ServiceResponse.success();
        }
        catch (e)
        {
            this._log.error(e);
            return ServiceResponse.failure(e);
        }
    }

    // TODO
    private async broadcastMessage(event: any): Promise<ServiceResponse<void>>
    {
        return;
    }

    // TODO
    private async deleteMessage(event: any): Promise<ServiceResponse<void>> 
    {
        return;
    }

    // TODO
    private async viewMessages(event: any): Promise<ServiceResponse<void>> 
    {
        // only retrieves messages from current session
        // fromTo property => checks if includes (connectionId#username) prop
        // pk(connId) + sk(name) => partition key
        // or create an index for user and recipient
        return;
    }

    private async listActiveUsers(event: any): Promise<ServiceResponse<void>>
    {
        try
        {
            const { connectionId } = event.requestContext;

            const activeUsers = await this._usersService.getUsernames();
            await this._gatewayService.postToConnection(connectionId, activeUsers);
        }
        catch (e)
        {
            this._log.error('Failed to list all active users:', e);
            return ServiceResponse.failure(e);
        }
    }
}