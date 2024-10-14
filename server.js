const WebSocket = require('ws');
const PORT = process.env.PORT || 3000;

// Create a WebSocket server
const server = new WebSocket.Server({ port: PORT }, () => {
    console.log(`WebSocket server is running on port ${PORT}`);
});

// Store connected clients
let unityClient = null; // Assuming there's only one Unity client
let webClients = {};    // Map from unique letters to web clients

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

    // Identify client type based on a query parameter or initial message
    ws.once('message', (message) => {
        try {
            const parsedMessage = JSON.parse(message);

            if (parsedMessage.type === 'unity') {
                // Unity client connection
                unityClient = ws;
                console.log('Unity client connected');

                // Send a connection acknowledgment to Unity client
                ws.send(JSON.stringify({ type: 'connection', data: 'UnityClient' }));

                ws.on('message', (msg) => {
                    // Handle messages from Unity client
                    console.log(`Message from Unity client: ${msg}`);

                    // Example: Forward messages to web clients if needed
                    // ...
                });

                ws.on('close', () => {
                    console.log('Unity client disconnected');
                    unityClient = null;
                });
            } else if (parsedMessage.type === 'web') {
                // Web client connection
                const letter = generateUniqueLetter();
                webClients[letter] = ws;
                console.log(`Web client connected with letter: ${letter}`);

                // Send the unique letter to the web client
                ws.send(JSON.stringify({ type: 'connection', data: letter }));

                ws.on('message', (msg) => {
                    console.log(`Message from web client ${letter}: ${msg}`);

                    // Forward the command to the Unity client
                    if (unityClient && unityClient.readyState === WebSocket.OPEN) {
                        const commandMessage = JSON.stringify({
                            type: 'command',
                            data: msg
                        });
                        unityClient.send(commandMessage);
                    }
                });

                ws.on('close', () => {
                    console.log(`Web client ${letter} disconnected`);
                    delete webClients[letter];
                });
            } else {
                console.log('Unknown client type');
                ws.close();
            }
        } catch (error) {
            console.log('Error parsing initial message:', error);
            ws.close();
        }
    });
});
