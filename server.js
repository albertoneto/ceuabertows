const WebSocket = require('ws');
const PORT = process.env.PORT || 3000;

const server = new WebSocket.Server({ port: PORT }, () => {
    console.log(`WebSocket server is running on port ${PORT}`);
});

let unityClient = null;
let webClients = {};

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

    const letter = generateUniqueLetter();
    ws.clientLetter = letter;
    ws.isUnityClient = false;

    ws.send(JSON.stringify({ type: 'connection', data: letter }));

    setTimeout(() => {
        ws.send(JSON.stringify({ type: 'ping' }));
    }, 50);

    webClients[letter] = ws;

    ws.on('message', (message) => {
        let messageString = message.toString();
        console.log(`Received message from client ${ws.clientLetter}: ${messageString}`);

        if (messageString.trim() === 'restart') {
            console.log('Reiniciando todas as conexões...');

            if (unityClient && unityClient.readyState === WebSocket.OPEN) {
                unityClient.close();
            }
            unityClient = null;

            for (const letter in webClients) {
                const client = webClients[letter];
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'reset' }));
                    client.close();
                }
                delete webClients[letter];
            }
            return;
        }else if (messageString.trim() === 'pong') {
            ws.isUnityClient = true;
            unityClient = ws;
            console.log('Unity client connected');
            delete webClients[ws.clientLetter];
            return;
        }

        let msg;
        try {
            msg = JSON.parse(messageString);
        } catch (error) {
            console.log('Received non-JSON message:', messageString);
            return;
        }

        if (ws.isUnityClient) {
            if (msg.letter && webClients[msg.letter]) {
                const webClient = webClients[msg.letter];
                if (webClient.readyState === WebSocket.OPEN) {
                    webClient.send(JSON.stringify(msg));
                }
            } else {
                console.log('Received message from Unity client without a letter:', msg);
            }
        } else {
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
