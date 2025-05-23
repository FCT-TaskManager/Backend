const { DataTypes } = require("sequelize")
const { sequelize } = require("../config/db")

const TimeEntry = sequelize.define(
  "TimeEntry",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    duration: {
      type: DataTypes.INTEGER, // Duración en segundos
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = TimeEntry