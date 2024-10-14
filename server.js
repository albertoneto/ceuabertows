const WebSocket = require('ws');
const http = require('http');

// Utilize a porta definida pelo Heroku ou 3000
const PORT = process.env.PORT || 3000;

// Cria um servidor HTTP
const server = http.createServer();

// Cria o servidor WebSocket ligado ao servidor HTTP
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Novo cliente conectado');

  ws.on('message', (message) => {
    console.log(`Mensagem recebida: ${message}`);

    // Repassa a mensagem para todos os clientes conectados
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('Cliente desconectado');
  });
});

server.listen(PORT, () => {
  console.log(`Servidor está ouvindo na porta ${PORT}`);
});
