const express = require('express');
const cors = require('cors');

const apiRoutes = require('./routes/api');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Configure CORS options for your Vercel frontend deployments
const corsOptions = {
  origin: [
    'https://care-vault-hvocj5qnu-care-vault.vercel.app',
    'https://carevault-dusky.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply CORS middleware globally BEFORE your routes
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

app.use((req, res, next) => {
    console.log('[REQUEST]', req.method, req.originalUrl);
    next();
});

app.get('/health', (req, res) => {
    res.status(200).json({ success: true, data: { ok: true }, message: 'Operation successful.' });
});

app.use('/api', apiRoutes);

app.use(errorHandler);

module.exports = app;
