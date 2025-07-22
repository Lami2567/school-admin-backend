const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.PG_DATABASE,
  process.env.PG_USER,
  process.env.PG_PASSWORD,
  {
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    dialect: 'postgres',
    logging: false,
  }
);

// User model
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'parent', 'student'), allowNull: false, defaultValue: 'admin' },
});

// Class model
const Class = sequelize.define('Class', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
});

// EmailLog model
const EmailLog = sequelize.define('EmailLog', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  subject: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  recipients: { type: DataTypes.STRING, allowNull: false },
  class: { type: DataTypes.STRING, allowNull: true },
  sentBy: { type: DataTypes.INTEGER, allowNull: false },
  attachments: { type: DataTypes.JSONB, allowNull: true },
  sentAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
});

// Associations
User.hasMany(EmailLog, { foreignKey: 'sentBy' });
EmailLog.belongsTo(User, { foreignKey: 'sentBy' });
Class.hasMany(User, { foreignKey: 'classId' });
User.belongsTo(Class, { foreignKey: 'classId' });

module.exports = { sequelize, DataTypes, User, Class, EmailLog }; 