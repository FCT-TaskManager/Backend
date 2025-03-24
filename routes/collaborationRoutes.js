const express = require("express")
const router = express.Router()
const collaborationController = require("../controllers/collaborationController")
const { protect } = require("../middleware/auth")

// Aplicar middleware de autenticación a todas las rutas
router.use(protect)

// Rutas de invitaciones
router.get("/invitations/project/:projectId/available-users", collaborationController.getAvailableUsers)
router.post("/invitations/invite", collaborationController.inviteUser)
router.post("/invitations/respond", collaborationController.respondToInvitation)
router.get("/invitations/pending", collaborationController.getPendingInvitations)

// Rutas de notificaciones
router.get("/notifications", collaborationController.getNotifications)
router.put("/notifications/:notificationId/read", collaborationController.markAsRead)
router.put("/notifications/read-all", collaborationController.markAllAsRead)

module.exports = router

