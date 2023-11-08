import { RouteKey } from "../maps/RouteKeys";

export type WebSocketEvent = ConnectEvent & DisconnectEvent;

export type ConnectEvent =
{
    requestContext: { connectionId: string, routeKey: RouteKey };
    queryStringParameters: { token: string };
};

export type DisconnectEvent =
{
    requestContext: { connectionId: string, routeKey: RouteKey };
};

export type SetNameEvent =
{
    requestContext: { connectionId: string, routeKey: RouteKey };
    body: { username: string };
};