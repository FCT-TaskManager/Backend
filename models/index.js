const { sequelize } = require('../config/db');
const User = require('./User');
const Task = require('./Task');

// Definir relaciones
User.hasMany(Task, { foreignKey: 'userId', as: 'tasks' });
Task.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Task,
};