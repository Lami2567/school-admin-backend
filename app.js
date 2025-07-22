require('dotenv').config();
const cors = require('cors');

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const emailRouter = require('./routes/email');
const classesRouter = require('./routes/classes');

const app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/auth', authRouter);
// app.use('/users', usersRouter); // Commented out, replaced by /api/auth
app.use('/api/email', emailRouter);
app.use('/api/classes', classesRouter);

module.exports = app;
