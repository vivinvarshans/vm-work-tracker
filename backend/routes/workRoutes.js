const express = require('express');
const router = express.Router();
const WorkModel = require('../models/workModel');

// Get all work sessions
router.get('/', async (req, res) => {
    try {
        const sessions = await WorkModel.getAll();
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start work session
router.post('/start', async (req, res) => {
    try {
        const { employee_name, project_name, task_description, activity_type } = req.body;
        
        if (!employee_name || !project_name || !task_description || !activity_type) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        const result = await WorkModel.startSession(employee_name, project_name, task_description, activity_type);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Stop work session
router.post('/:id/stop', async (req, res) => {
    try {
        const sessionId = req.params.id;
        const result = await WorkModel.stopSession(sessionId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get active session
router.get('/active/:employeeName', async (req, res) => {
    try {
        const employeeName = req.params.employeeName;
        const session = await WorkModel.getActiveSession(employeeName);
        res.json(session);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
