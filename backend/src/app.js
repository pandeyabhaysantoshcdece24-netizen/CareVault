const express = require('express');
const cors = require('cors');

const apiRoutes = require('./routes/api');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Configure CORS to allow all origins
app.use(cors({ origin: '*' }));

app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({ success: true, data: { ok: true }, message: 'Operation successful.' });
});

app.use('/api', apiRoutes);

app.use(errorHandler);

module.exports = app;
