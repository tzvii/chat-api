export default class Config
{
    // AWS
    public AwsRegion: string;
    public ConnectionEndpoint: string;
    public ActiveChatUsersTable: string;
    public ActiveConnectionIdsTable: string;
    public ChatMessagesTable: string;
    public ChatUserExpiration: string;
    public ChatMessageExpiration: string;

    constructor()
    {
        this.AwsRegion = process.env.AWS_REGION;
        this.ConnectionEndpoint = process.env.CONNECTION_ENDPOINT;
        this.ActiveChatUsersTable = process.env.ACTIVE_CHAT_USERS_TABLE;
        this.ActiveConnectionIdsTable = process.env.ACTIVE_CONNECTION_IDS_TABLE;
        this.ChatMessagesTable = process.env.CHAT_MESSAGES_TABLE;
        this.ChatUserExpiration = process.env.CHAT_USER_EXPIRATION;
        this.ChatMessageExpiration = process.env.CHAT_MESSAGE_EXPIRATION;
    }
}