const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const apiRoutes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler.middleware');
const { formatErrorResponse } = require('./utils/responseFormatter');

const app = express();

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow all in development or when matched with CLIENT_ORIGIN
    if (!origin || env.NODE_ENV !== 'production' || origin === env.CLIENT_ORIGIN) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Root Routes
app.use('/api', apiRoutes);

// Fallback for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json(
    formatErrorResponse('NOT_FOUND', `Cannot ${req.method} ${req.originalUrl}`)
  );
});

// Central Error Handler
app.use(errorHandler);

module.exports = app;
