const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { EmailLog, User, Class } = require('../models');
const { Op } = require('sequelize');
const multer = require('multer');
const upload = multer(); // For parsing multipart/form-data (attachments)

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

// POST /api/email/send
router.post('/send', requireAuth, upload.array('attachments'), async (req, res) => {
  try {
    const { subject, message, recipients, class: className } = req.body;
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        filename: file.originalname,
        content: file.buffer,
        contentType: file.mimetype,
      }));
    }

    // Resolve recipient emails
    let toEmails = [];
    if (recipients === 'all') {
      const users = await User.findAll({ attributes: ['email'] });
      toEmails = users.map(u => u.email);
    } else if (recipients === 'students' || recipients === 'parents') {
      const users = await User.findAll({ where: { role: recipients.slice(0, -1) }, attributes: ['email'] });
      toEmails = users.map(u => u.email);
    } else if (className) {
      // Find users in the specified class
      const users = await User.findAll({ where: { classId: className }, attributes: ['email'] });
      toEmails = users.map(u => u.email);
    } else {
      // fallback: treat recipients as a comma-separated list
      toEmails = recipients.split(',').map(e => e.trim());
    }

    if (!toEmails.length) {
      return res.status(400).json({ error: 'No recipients found for this group.' });
    }

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or your SMTP
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: toEmails,
      subject,
      html: message,
      attachments,
    });

    // Log to DB
    await EmailLog.create({
      subject,
      message,
      recipients: recipients,
      class: className || null,
      sentBy: req.user.id,
      attachments: attachments.map(a => ({ filename: a.filename, contentType: a.contentType })),
      sentAt: new Date(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Email send error:', err); // Add this line for detailed error logging
    res.status(500).json({ error: 'Failed to send email', details: err.message });
  }
});

// GET /api/email/logs
router.get('/logs', requireAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = '' } = req.query;
    const where = search ? {
      [Op.or]: [
        { subject: { [Op.iLike]: `%${search}%` } },
        { recipients: { [Op.iLike]: `%${search}%` } },
      ],
    } : {};
    const { count, rows } = await EmailLog.findAndCountAll({
      where,
      order: [['sentAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize),
      include: [{ model: User, attributes: ['id', 'name', 'email', 'role'] }],
    });
    res.json({ count, logs: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// GET /api/email/recipients
router.get('/recipients', requireAuth, async (req, res) => {
  try {
    const { group, classId } = req.query;
    const classes = await Class.findAll({ attributes: ['id', 'name'] });
    let emails = [];
    if (group === 'all') {
      const users = await User.findAll({ attributes: ['email'] });
      emails = users.map(u => u.email);
    } else if (group === 'students' || group === 'parents') {
      const users = await User.findAll({ where: { role: group.slice(0, -1) }, attributes: ['email'] });
      emails = users.map(u => u.email);
    } else if (group === 'class' && classId) {
      const users = await User.findAll({ where: { classId }, attributes: ['email'] });
      emails = users.map(u => u.email);
    }
    res.json({ groups: ['all', 'students', 'parents'], classes, emails });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recipient groups' });
  }
});

module.exports = router; 