const express = require('express');
const cors = require('cors');

const apiRoutes = require('./routes/api');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Apply dynamic CORS safelist logic for Vercel deploys and local development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow local development tools and Postman tests
    if (!origin) return callback(null, true);

    const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
    const isVercelDeployment = origin.includes('care-vault') && origin.endsWith('.vercel.app');

    if (isLocalhost || isVercelDeployment) {
      callback(null, true);
    } else {
      console.warn(`🔴 Blocked by CORS policy: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
