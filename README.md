# Chat API
A WebSocket based chat API that uses AWS for cloud infrastructure

## How it's used:
* First a user should connect to the WebSocket API. One way of doing this is by installing the `wscat` package from `npm` -- a WebSocket URL will be provided upon request.
* Once connected, each request must be sent containing a `routeKey`. This `routeKey` property will be used to trigger the appropriate processing. Depending on which route is selected, other properties will be required for successful processing.
* Example request: `{ "action": "setName", "username": "bob" }`
<br><br>

**Chat API routes:**

***setName({ action, username }):*** Initial request user must make to activate their profile.
- action: "`setName`"
- username: username desired -- must be unique

***sendMessage({ action, to, message }):*** Send a message to desired user.
- action: "`sendMessage`"
- to: the receiver's username
- message: desired message

***listUsers({ action }):*** List all active users.
- action: "`listUsers`"
