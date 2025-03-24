const { DataTypes } = require("sequelize")
const { sequelize } = require("../config/db")

const Column = sequelize.define(
  "Column",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Projects",
        key: "id",
      },
    },
  },
  {
    timestamps: true,
  },
)

module.exports = Column

