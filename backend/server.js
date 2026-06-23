require('dotenv').config();

const app = require('./src/app');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

async function startServer() {
    try {
        app.listen(PORT, () => {
            console.log(`[SERVER] Server listening on port ${PORT}`);
        });
    } catch (err) {
        console.error('[SERVER] Failed to initialize:', err.message);
        console.error('[SERVER] Server startup aborted.');
        process.exit(1);
    }
}

startServer();

process.on('SIGINT', async () => {
    console.log('[SERVER] Shutting down gracefully...');
    process.exit(0);
});
