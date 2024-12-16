const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const config = require('./config');
const createRateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const mealsRouter = require('./routes/meals');
const storesRouter = require('./routes/stores');

const app = express();

// Security
app.use(helmet());
app.use(cors(config.cors));

// Middleware
app.use(compression());
app.use(express.json({ limit: '1mb', strict: true }));
app.use('/api/', createRateLimiter());

// Routes
app.use('/api/meals', mealsRouter);
app.use('/api/stores', storesRouter);

// Error handling
app.use(errorHandler);

module.exports = app;