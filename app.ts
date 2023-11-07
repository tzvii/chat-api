import Config from "./config/Config";
import { LogService } from "./services/LogService";
import { MessagingService } from "./services/MessagingService";
import { RoutesService } from "./services/RoutesService";
import { UsersService } from "./services/UsersService";
import { ApiGatewayService } from "./services/aws/ApiGatewayService";
import { DynamoDBService } from "./services/aws/DynamoDBService";

export class App
{
    private readonly _config: Config;
    private readonly _log: LogService;
    private readonly _gatewayService: ApiGatewayService;
    private readonly _dynamoService: DynamoDBService;
    private readonly _usersService: UsersService;
    private readonly _messagingService: MessagingService;
    private readonly _routesService: RoutesService;

    constructor()
    {
        this._config = new Config();
        this._log = new LogService();
        this._gatewayService = new ApiGatewayService();
        this._dynamoService = new DynamoDBService();
        this._usersService = new UsersService(this._dynamoService);
        this._messagingService = new MessagingService(this._gatewayService, this._dynamoService, this._usersService);
        this._routesService = new RoutesService(this._gatewayService, this._messagingService, this._usersService);
    }

    public async run(event: any): Promise<any>
    {
        if (event?.requestContext)
            return await this._routesService.triggerRoute(event);

        this._log.error(`Invalid event: ${JSON.stringify(event)}`);
    }
}