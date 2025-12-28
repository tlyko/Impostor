const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require("socket.io");
const socketHandler = require('./lib/socketHandler');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });

    const io = new Server(httpServer);
    socketHandler(io);

    httpServer.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log('> Socket.io server initialized');
    });
});
