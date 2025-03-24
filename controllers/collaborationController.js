const { User, Project, ProjectInvitation, ProjectMember, Notification } = require("../models")
const { Op } = require("sequelize")

// ===== INVITACIONES =====

// Obtener usuarios disponibles para invitar
const getAvailableUsers = async (req, res) => {
  try {
    const projectId = req.params.projectId
    const userId = req.user.id

    // Verificar que el proyecto exista y el usuario sea propietario o administrador
    const project = await Project.findOne({
      where: { id: projectId },
      include: [
        {
          model: ProjectMember,
          as: "members",
        },
      ],
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Proyecto no encontrado",
      })
    }

    // Verificar si el usuario es propietario o administrador
    const isOwner = project.ownerId === userId
    const isAdmin =
      project.members && project.members.some((member) => member.userId === userId && member.role === "admin")

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: "No tienes permisos para invitar usuarios a este proyecto",
      })
    }

    // Obtener IDs de usuarios que ya son miembros
    const memberIds = project.members ? project.members.map((member) => member.userId) : []

    // Obtener IDs de usuarios que ya tienen invitaciones pendientes
    const pendingInvitations = await ProjectInvitation.findAll({
      where: {
        projectId,
        status: "pending",
      },
      attributes: ["inviteeId"],
    })

    const pendingInviteeIds = pendingInvitations.map((inv) => inv.inviteeId)

    // Combinar todos los IDs que deben excluirse
    const excludeIds = [...memberIds, ...pendingInviteeIds, project.ownerId]

    // Obtener usuarios disponibles
    const availableUsers = await User.findAll({
      where: {
        id: { [Op.notIn]: excludeIds },
      },
      attributes: ["id", "name", "email"],
    })

    return res.status(200).json({
      success: true,
      data: availableUsers,
    })
  } catch (error) {
    console.error("Error getting available users:", error)
    return res.status(500).json({
      success: false,
      error: "Error al obtener usuarios disponibles",
      details: error.message,
    })
  }
}

// Invitar usuario a un proyecto
const inviteUser = async (req, res) => {
  try {
    const { projectId, userId } = req.body
    const inviterId = req.user.id

    // Verificar que el proyecto exista y el usuario sea propietario o administrador
    const project = await Project.findOne({
      where: { id: projectId },
      include: [
        {
          model: ProjectMember,
          as: "members",
        },
      ],
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Proyecto no encontrado",
      })
    }

    // Verificar si el usuario es propietario o administrador
    const isOwner = project.ownerId === inviterId
    const isAdmin =
      project.members && project.members.some((member) => member.userId === inviterId && member.role === "admin")

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: "No tienes permisos para invitar usuarios a este proyecto",
      })
    }

    // Verificar que el usuario a invitar exista
    const invitee = await User.findByPk(userId)
    if (!invitee) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      })
    }

    // Verificar que el usuario no sea ya miembro del proyecto
    const isMember = project.members && project.members.some((member) => member.userId === userId)
    if (isMember) {
      return res.status(400).json({
        success: false,
        error: "El usuario ya es miembro del proyecto",
      })
    }

    // Verificar que no exista una invitación pendiente
    const existingInvitation = await ProjectInvitation.findOne({
      where: {
        projectId,
        inviteeId: userId,
        status: "pending",
      },
    })

    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        error: "Ya existe una invitación pendiente para este usuario",
      })
    }

    // Crear la invitación
    const invitation = await ProjectInvitation.create({
      projectId,
      inviterId,
      inviteeId: userId,
      status: "pending",
    })

    // Crear notificación para el usuario invitado
    const inviter = await User.findByPk(inviterId, { attributes: ["name"] })
    await Notification.create({
      userId,
      type: "invitation",
      message: `${inviter.name} te ha invitado a unirte al proyecto "${project.name}"`,
      relatedId: invitation.id,
    })

    return res.status(201).json({
      success: true,
      data: invitation,
    })
  } catch (error) {
    console.error("Error inviting user:", error)
    return res.status(500).json({
      success: false,
      error: "Error al invitar usuario",
      details: error.message,
    })
  }
}

// Responder a una invitación (aceptar o rechazar)
const respondToInvitation = async (req, res) => {
  try {
    const { invitationId, accept } = req.body
    const userId = req.user.id

    // Verificar que la invitación exista y sea para este usuario
    const invitation = await ProjectInvitation.findOne({
      where: {
        id: invitationId,
        inviteeId: userId,
        status: "pending",
      },
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "ownerId"],
        },
        {
          model: User,
          as: "inviter",
          attributes: ["id", "name"],
        },
      ],
    })

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: "Invitación no encontrada o ya procesada",
      })
    }

    // Actualizar el estado de la invitación
    invitation.status = accept ? "accepted" : "rejected"
    await invitation.save()

    // Si se acepta, añadir al usuario como miembro del proyecto
    if (accept) {
      await ProjectMember.create({
        projectId: invitation.projectId,
        userId,
        role: "member",
      })
    }

    // Crear notificación para el usuario que invitó
    await Notification.create({
      userId: invitation.inviterId,
      type: "invitation_response",
      message: `${req.user.name} ha ${accept ? "aceptado" : "rechazado"} tu invitación al proyecto "${invitation.project.name}"`,
      relatedId: invitation.projectId,
    })

    return res.status(200).json({
      success: true,
      data: invitation,
      message: `Invitación ${accept ? "aceptada" : "rechazada"} correctamente`,
    })
  } catch (error) {
    console.error("Error responding to invitation:", error)
    return res.status(500).json({
      success: false,
      error: "Error al responder a la invitación",
      details: error.message,
    })
  }
}

// Obtener invitaciones pendientes para el usuario actual
const getPendingInvitations = async (req, res) => {
  try {
    const userId = req.user.id

    const invitations = await ProjectInvitation.findAll({
      where: {
        inviteeId: userId,
        status: "pending",
      },
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name"],
        },
        {
          model: User,
          as: "inviter",
          attributes: ["id", "name"],
        },
      ],
    })

    return res.status(200).json({
      success: true,
      data: invitations,
    })
  } catch (error) {
    console.error("Error getting pending invitations:", error)
    return res.status(500).json({
      success: false,
      error: "Error al obtener invitaciones pendientes",
      details: error.message,
    })
  }
}

// ===== NOTIFICACIONES =====

// Obtener notificaciones del usuario actual
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id

    const notifications = await Notification.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
      limit: 50, // Limitar a las 50 más recientes
    })

    return res.status(200).json({
      success: true,
      data: notifications,
    })
  } catch (error) {
    console.error("Error getting notifications:", error)
    return res.status(500).json({
      success: false,
      error: "Error al obtener notificaciones",
      details: error.message,
    })
  }
}

// Marcar notificación como leída
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params
    const userId = req.user.id

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        userId,
      },
    })

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: "Notificación no encontrada",
      })
    }

    notification.read = true
    await notification.save()

    return res.status(200).json({
      success: true,
      data: notification,
    })
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return res.status(500).json({
      success: false,
      error: "Error al marcar notificación como leída",
      details: error.message,
    })
  }
}

// Marcar todas las notificaciones como leídas
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id

    await Notification.update(
      { read: true },
      {
        where: {
          userId,
          read: false,
        },
      },
    )

    return res.status(200).json({
      success: true,
      message: "Todas las notificaciones marcadas como leídas",
    })
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return res.status(500).json({
      success: false,
      error: "Error al marcar todas las notificaciones como leídas",
      details: error.message,
    })
  }
}

module.exports = {
  // Invitaciones
  getAvailableUsers,
  inviteUser,
  respondToInvitation,
  getPendingInvitations,

  // Notificaciones
  getNotifications,
  markAsRead,
  markAllAsRead,
}

