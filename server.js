const WebSocket = require('ws');
const PORT = process.env.PORT || 3000;

// Create a WebSocket server
const server = new WebSocket.Server({ port: PORT }, () => {
    console.log(`WebSocket server is running on port ${PORT}`);
});

// Store connected clients
let unityClient = null;           // The Unity client
let webClients = {};              // Map letters to web clients

// Function to generate a unique letter for each web client
function generateUniqueLetter() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let letter;
    do {
        letter = letters.charAt(Math.floor(Math.random() * letters.length));
    } while (webClients[letter]);
    return letter;
}

server.on('connection', (ws) => {
    console.log('New client connected');

    // Assign a unique letter to the client
    const letter = generateUniqueLetter();
    ws.clientLetter = letter;
    ws.isUnityClient = false;

    // Send connection message to client
    ws.send(JSON.stringify({ type: 'connection', data: letter }));

    // Send a 'ping' message after a short delay to detect Unity client
    setTimeout(() => {
        ws.send(JSON.stringify({ type: 'ping' }));
    }, 50); // Delay in milliseconds

    // Add the client to webClients temporarily
    webClients[letter] = ws;

    ws.on('message', (message) => {
        // Convert message to string in case it's a Buffer
        let messageString = message.toString();
        console.log(`Received message from client ${ws.clientLetter}: ${messageString}`);

        // Tenta parsear a mensagem como JSON
        let msg;
        try {
            msg = JSON.parse(messageString);
        } catch (error) {
            console.log('Received non-JSON message:', messageString);
            return;
        }

        // Unity client responds with 'pong' to 'ping'
        if (msg.type === 'pong') {
            ws.isUnityClient = true;
            unityClient = ws;
            console.log('Unity client connected');
            // Remove from webClients since it's the Unity client
            delete webClients[ws.clientLetter];
            return;
        }

        if (ws.isUnityClient) {
            // Message from Unity client
            // Forward to specific web client based on 'letter' field
            if (msg.letter && webClients[msg.letter]) {
                const webClient = webClients[msg.letter];
                if (webClient.readyState === WebSocket.OPEN) {
                    webClient.send(JSON.stringify(msg));
                }
            } else {
                console.log('Received message from Unity client without a letter:', msg);
            }
        } else {
            // Message from web client
            // Wrap the message in the expected format
            if (unityClient && unityClient.readyState === WebSocket.OPEN) {
                const wrappedMessage = {
                    type: 'command',
                    data: JSON.stringify(msg)
                };
                unityClient.send(JSON.stringify(wrappedMessage));
            } else {
                console.log('Unity client is not connected');
            }
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        if (ws.isUnityClient) {
            unityClient = null;
        } else {
            delete webClients[ws.clientLetter];
        }
    });
});
