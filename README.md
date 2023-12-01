# Chat API
A WebSocket-based chat API leveraging AWS for cloud infrastructure. The API in this project is stored on a Lambda, AWS API Gateway was used to set up the WebSocket, and DynamoDB was employed for data storage.

## Requirements:
- Node.js (Install from [https://nodejs.org/](https://nodejs.org/))

## How to Use:
1. Connect to the WebSocket API by installing the `wscat` package from `npm`. A WebSocket URL will be provided upon request.
   ```bash
   npm install -g wscat
   ```
   ```bash
   wscat -c <WebSocket_URL>
   ```

2. Once connected, send requests with a `routeKey` property to trigger specific processing. Depending on the selected route, additional properties may be required for successful processing.
   ```json
   { "action": "setName", "username": "bob" }
   ```

**Chat API Routes:**

***setName({ action, username }):*** 
Activate a user's profile with the initial request.
- action: "`setName`"
- username: Desired unique username

***sendMessage({ action, to, message }):*** 
Send a message to a specified user.
- action: "`sendMessage`"
- to: Receiver's username
- message: Desired message

***listUsers({ action }):*** 
List all active users.
- action: "`listUsers`"
