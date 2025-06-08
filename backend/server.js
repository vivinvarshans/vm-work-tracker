require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { initializeDatabase } = require('./config/database');
const ExcelService = require('./services/excelService');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Excel Service
const excelService = new ExcelService();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve Excel files for download
app.use('/exports', express.static(path.join(__dirname, '../exports')));

// Initialize database
initializeDatabase();

// Modified API Routes with Excel auto-update
const vmRoutes = require('./routes/vmRoutes');
const workRoutes = require('./routes/workRoutes');

// Middleware to trigger Excel update after data changes
const triggerExcelUpdate = (req, res, next) => {
    const originalSend = res.send;
    res.send = function(data) {
        originalSend.call(this, data);
        // Trigger Excel update after successful response
        if (res.statusCode >= 200 && res.statusCode < 300) {
            setTimeout(() => excelService.triggerUpdate(), 1000);
        }
    };
    next();
};

app.use('/api/vms', triggerExcelUpdate, vmRoutes);
app.use('/api/work', triggerExcelUpdate, workRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        excelFiles: {
            vmUsage: '/exports/vm_usage_data.xlsx',
            workTracking: '/exports/work_tracking_data.xlsx'
        }
    });
});

// Excel download endpoints
app.get('/api/download/vm-usage', (req, res) => {
    const filePath = path.join(__dirname, '../exports/vm_usage_data.xlsx');
    res.download(filePath, 'vm_usage_data.xlsx');
});

app.get('/api/download/work-tracking', (req, res) => {
    const filePath = path.join(__dirname, '../exports/work_tracking_data.xlsx');
    res.download(filePath, 'work_tracking_data.xlsx');
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Handle 404
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 VM Tracker: http://localhost:${PORT}/pages/vm-usage.html`);
    console.log(`⏱️  Work Tracker: http://localhost:${PORT}/pages/work-tracker.html`);
    console.log(`📁 Excel Files: http://localhost:${PORT}/exports/`);
});

module.exports = app;
