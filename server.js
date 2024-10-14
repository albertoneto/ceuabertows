const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);

// Inicia o servidor WebSocket
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Novo cliente conectado');
    ws.send(JSON.stringify({ type: 'connection', data: 'player1' }));

    ws.on('message', (message) => {
        console.log('Mensagem recebida:', message);
        // Repasse a mensagem para os outros clientes conectados
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        console.log('Conexão fechada');
    });
});

//Adiciona uma rota básica para verificar se o servidor está rodando
app.get('/', (req, res) => {
    res.send('Servidor WebSocket está rodando!');
});

//Inicia o servidor HTTP e WebSocket
server.listen(443, () => {
    console.log(`Servidor rodando na porta 443`);
});