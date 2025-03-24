const express = require("express")
const router = express.Router()
const kanbanTaskController = require("../controllers/kanbanTaskController")
const { protect } = require("../middleware/auth")

// Aplicar middleware de autenticación a todas las rutas
router.use(protect)

// Rutas de tareas kanban
router.route("/").post(kanbanTaskController.createKanbanTask)

router.route("/:id").put(kanbanTaskController.updateKanbanTask).delete(kanbanTaskController.deleteKanbanTask)

router.route("/:id/move").put(kanbanTaskController.moveKanbanTask)

router.route("/reorder").post(kanbanTaskController.reorderKanbanTasks)

module.exports = router

