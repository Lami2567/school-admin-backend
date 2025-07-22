const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Class } = require('../models');

// JWT auth middleware
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  try {
    const token = auth.split(' ')[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// GET /api/classes/ (list all classes)
router.get('/', requireAuth, async (req, res) => {
  try {
    const classes = await Class.findAll();
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// POST /api/classes/ (create class)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing class name' });
    const existing = await Class.findOne({ where: { name } });
    if (existing) return res.status(400).json({ error: 'Class already exists' });
    const newClass = await Class.create({ name });
    res.json(newClass);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create class' });
  }
});

// PUT /api/classes/:id (update class)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    const { id } = req.params;
    const classObj = await Class.findByPk(id);
    if (!classObj) return res.status(404).json({ error: 'Class not found' });
    classObj.name = name || classObj.name;
    await classObj.save();
    res.json(classObj);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update class' });
  }
});

// DELETE /api/classes/:id (delete class)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const classObj = await Class.findByPk(id);
    if (!classObj) return res.status(404).json({ error: 'Class not found' });
    await classObj.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

module.exports = router; 