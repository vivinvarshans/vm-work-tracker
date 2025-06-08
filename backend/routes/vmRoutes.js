const express = require('express');
const router = express.Router();
const VMModel = require('../models/vmModel');

// Get all VMs
router.get('/', async (req, res) => {
    try {
        const vms = await VMModel.getAll();
        res.json(vms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new VM
router.post('/', async (req, res) => {
    try {
        const { name, platform } = req.body;
        if (!name || !platform) {
            return res.status(400).json({ error: 'Name and platform are required' });
        }
        const result = await VMModel.create(name, platform);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start VM session
router.post('/:id/start', async (req, res) => {
    try {
        const { user_name, purpose } = req.body;
        const vmId = req.params.id;
        
        if (!user_name || !purpose) {
            return res.status(400).json({ error: 'User name and purpose are required' });
        }
        
        const result = await VMModel.startSession(vmId, user_name, purpose);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Stop VM session
router.post('/:id/stop', async (req, res) => {
    try {
        const vmId = req.params.id;
        const result = await VMModel.stopSession(vmId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all VM sessions
router.get('/sessions', async (req, res) => {
    try {
        const sessions = await VMModel.getAllSessions();
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

