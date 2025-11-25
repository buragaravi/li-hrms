require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint - Returns metadata
app.get('/', (req, res) => {
  res.json({
    name: 'HRMS Backend API',
    version: '1.0.0',
    status: 'running',
    message: 'HRMS Backend Server is operational',
    endpoints: {
      authentication: '/api/auth',
      employees: '/api/employees'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Import and mount module routes
// Authentication routes
const authRoutes = require('./authentication/index.js');
app.use('/api/auth', authRoutes);

// Employees routes
const employeeRoutes = require('./employees/index.js');
app.use('/api/employees', employeeRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 HRMS Backend Server is running on port ${PORT}`);
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`📋 API Root: http://localhost:${PORT}/`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
});

