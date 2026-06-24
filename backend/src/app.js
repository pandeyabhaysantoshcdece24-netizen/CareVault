const express = require('express');
const cors = require('cors');

const apiRoutes = require('./routes/api');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Configure CORS to allow all origins with full configuration
app.use(cors({
  origin: '*', // Allows all domains temporarily to break through the CORS wall
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Crucial: Handle preflight requests globally
app.options('*', cors());

app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({ success: true, data: { ok: true }, message: 'Operation successful.' });
});

app.use('/api', apiRoutes);

app.use(errorHandler);

module.exports = app;
