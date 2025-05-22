const express = require("express")
const router = express.Router()
const projectController = require("../controllers/projectController")
const { protect } = require("../middleware/auth")

// Aplicar middleware de autenticación a todas las rutas
router.use(protect)

// Rutas de proyectos
router.route("/").get(projectController.getProjects).post(projectController.createProject)

router.route("/:id").get(projectController.getProjectById)

// Rutas de columnas
router.route("/:id/columns").get(projectController.getProjectColumns)

// Rutas de tareas kanban
router.route("/:id/kanban-tasks").get(projectController.getProjectKanbanTasks)

module.exports = router