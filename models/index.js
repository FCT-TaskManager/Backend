const { sequelize } = require("../config/db")
const User = require("./User")
const Task = require("./Task") // Modelo original de tareas
const Project = require("./Project") // Nuevo modelo de proyectos
const Column = require("./Column") // Nuevo modelo de columnas
const KanbanTask = require("./KanbanTask") // Nuevo modelo de tareas Kanban
const { ProjectInvitation, ProjectMember, Notification } = require("./ProjectModels")

// Relaciones existentes para tareas normales
User.hasMany(Task, { foreignKey: "userId", as: "tasks" })
Task.belongsTo(User, { foreignKey: "userId", as: "user" })

// Relación directa para el propietario del proyecto
Project.belongsTo(User, {
  foreignKey: "ownerId",
  as: "owner",
})

// Asociaciones de Project
Project.hasMany(Column, {
  foreignKey: "projectId",
  as: "columns",
  onDelete: "CASCADE",
})

Project.hasMany(KanbanTask, {
  foreignKey: "projectId",
  as: "kanbanTasks",
  onDelete: "CASCADE",
})

// También podemos relacionar Project con Task si es necesario
Project.hasMany(Task, {
  foreignKey: "projectId",
  as: "tasks",
  onDelete: "CASCADE",
})

// Asociaciones de Column
Column.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
})

Column.hasMany(KanbanTask, {
  foreignKey: "columnId",
  as: "tasks",
  onDelete: "CASCADE",
})

// Asociaciones de KanbanTask
KanbanTask.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
})

KanbanTask.belongsTo(Column, {
  foreignKey: "columnId",
  as: "column",
})

// Asociación de KanbanTask con User
KanbanTask.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
})

// Asociaciones para ProjectMember
ProjectMember.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
})

ProjectMember.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
})

// Asociaciones de Project con miembros
Project.hasMany(ProjectMember, {
  foreignKey: "projectId",
  as: "members",
  onDelete: "CASCADE",
})

// Relación entre User y ProjectMember
User.hasMany(ProjectMember, { 
  as: "memberships", 
  foreignKey: "userId" 
})

// Asociaciones de ProjectInvitation
ProjectInvitation.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
})

ProjectInvitation.belongsTo(User, {
  foreignKey: "inviterId",
  as: "inviter",
})

ProjectInvitation.belongsTo(User, {
  foreignKey: "inviteeId",
  as: "invitee",
})

// Asociaciones de Notification
Notification.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
})
// Exportar todos los modelos
module.exports = {
  sequelize,
  User,
  Task,
  Project,
  Column,
  KanbanTask,
  ProjectInvitation,
  ProjectMember,
  Notification,
}