const { Project, Column, KanbanTask, User, ProjectMember } = require("../models")

// Obtener todos los proyectos
const getProjects = async (req, res) => {
  try {
    const userId = req.user.id

    // Obtener proyectos donde el usuario es propietario
    const ownedProjects = await Project.findAll({
      where: { ownerId: userId },
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "name", "email"],
        },
        {
          model: ProjectMember,
          as: "members",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "email"],
            },
          ],
        },
      ],
    })

    // Obtener proyectos donde el usuario es miembro
    const memberProjects = await Project.findAll({
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "name", "email"],
        },
        {
          model: ProjectMember,
          as: "members",
          where: { userId },
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "email"],
            },
          ],
        },
      ],
    })

    // Combinar los proyectos sin duplicados
    const allProjectIds = new Set()
    const allProjects = []

    // Añadir proyectos propios
    ownedProjects.forEach((project) => {
      allProjectIds.add(project.id)
      allProjects.push(project)
    })

    // Añadir proyectos donde es miembro (sin duplicar)
    memberProjects.forEach((project) => {
      if (!allProjectIds.has(project.id)) {
        allProjectIds.add(project.id)
        allProjects.push(project)
      }
    })

    // Ordenar por fecha de creación
    allProjects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return res.status(200).json({
      success: true,
      data: allProjects,
    })
  } catch (error) {
    console.error("Error getting projects:", error)
    return res.status(500).json({
      success: false,
      error: "Error al obtener proyectos",
      details: error.message,
    })
  }
}

// Obtener un proyecto por ID
const getProjectById = async (req, res) => {
  try {
    const projectId = req.params.id
    const userId = req.user.id

    // Verificar si el usuario es propietario o miembro del proyecto
    const project = await Project.findOne({
      where: { id: projectId },
      include: [
        {
          model: Column,
          as: "columns",
          include: [
            {
              model: KanbanTask,
              as: "tasks",
              order: [["order", "ASC"]],
            },
          ],
          order: [["order", "ASC"]],
        },
        {
          model: User,
          as: "owner",
          attributes: ["id", "name", "email"],
        },
        {
          model: ProjectMember,
          as: "members",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "email"],
            },
          ],
        },
      ],
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Proyecto no encontrado",
      })
    }

    // Verificar si el usuario es propietario o miembro
    const isOwner = project.ownerId === userId
    const isMember = project.members && project.members.some((member) => member.userId === userId)

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        error: "No tienes acceso a este proyecto",
      })
    }

    return res.status(200).json({
      success: true,
      data: project,
    })
  } catch (error) {
    console.error("Error getting project by ID:", error)
    return res.status(500).json({
      success: false,
      error: "Error al obtener el proyecto",
      details: error.message,
    })
  }
}

// Crear un nuevo proyecto
const createProject = async (req, res) => {
  try {
    const { name, description } = req.body
    const userId = req.user.id

    // Validar datos
    if (!name) {
      return res.status(400).json({
        success: false,
        error: "El nombre del proyecto es requerido",
      })
    }

    // Crear el proyecto
    const project = await Project.create({
      name,
      description: description || "",
      ownerId: userId,
    })

    // Crear columnas predeterminadas
    const defaultColumns = [
      { title: "Por hacer", order: 0 },
      { title: "En progreso", order: 1 },
      { title: "Finalizado", order: 2 },
    ]

    // Crear todas las columnas de forma asíncrona
    await Promise.all(
      defaultColumns.map((column) =>
        Column.create({
          ...column,
          projectId: project.id,
        }),
      ),
    )

    // Obtener el proyecto actualizado con columnas y propietario
    const projectWithColumns = await Project.findByPk(project.id, {
      include: [
        {
          model: Column,
          as: "columns",
          order: [["order", "ASC"]],
        },
        {
          model: User,
          as: "owner",
          attributes: ["id", "name", "email"],
        },
      ],
    })

    return res.status(201).json({
      success: true,
      data: projectWithColumns,
    })
  } catch (error) {
    console.error("Error creating project:", error)
    return res.status(500).json({
      success: false,
      error: "Error al crear el proyecto",
      details: error.message,
    })
  }
}

// Obtener columnas de un proyecto
const getProjectColumns = async (req, res) => {
  try {
    const projectId = req.params.id
    const userId = req.user.id

    // Verificar si el usuario es propietario o miembro del proyecto
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

    // Verificar si el usuario es propietario o miembro
    const isOwner = project.ownerId === userId
    const isMember = project.members && project.members.some((member) => member.userId === userId)

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        error: "No tienes acceso a este proyecto",
      })
    }

    const columns = await Column.findAll({
      where: { projectId },
      order: [["order", "ASC"]],
      include: [
        {
          model: KanbanTask,
          as: "tasks",
          order: [["order", "ASC"]],
        },
      ],
    })

    return res.status(200).json({
      success: true,
      data: columns,
    })
  } catch (error) {
    console.error("Error getting project columns:", error)
    return res.status(500).json({
      success: false,
      error: "Error al obtener las columnas del proyecto",
      details: error.message,
    })
  }
}

// Obtener tareas Kanban de un proyecto
const getProjectKanbanTasks = async (req, res) => {
  try {
    const projectId = req.params.id
    const userId = req.user.id

    // Verificar si el usuario es propietario o miembro del proyecto
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

    // Verificar si el usuario es propietario o miembro
    const isOwner = project.ownerId === userId
    const isMember = project.members && project.members.some((member) => member.userId === userId)

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        error: "No tienes acceso a este proyecto",
      })
    }

    const tasks = await KanbanTask.findAll({
      where: { projectId },
      order: [["order", "ASC"]],
    })

    return res.status(200).json({
      success: true,
      data: tasks,
    })
  } catch (error) {
    console.error("Error getting project kanban tasks:", error)
    return res.status(500).json({
      success: false,
      error: "Error al obtener las tareas kanban del proyecto",
      details: error.message,
    })
  }
}

// Modificar la función deleteProject para permitir eliminar proyectos con colaboradores

// Eliminar un proyecto
const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id
    const userId = req.user.id

    // Verificar que el proyecto pertenezca al usuario (solo el propietario puede eliminar)
    const project = await Project.findOne({
      where: { id: projectId, ownerId: userId },
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
        error: "Proyecto no encontrado o no tienes permisos para eliminarlo",
      })
    }

    // Primero eliminar todos los miembros del proyecto
    if (project.members && project.members.length > 0) {
      await ProjectMember.destroy({
        where: { projectId },
      })
    }

    // Eliminar todas las invitaciones del proyecto
    const { ProjectInvitation } = require("../models")
    await ProjectInvitation.destroy({
      where: { projectId },
    })

    // Eliminar el proyecto (las relaciones se eliminarán en cascada)
    await project.destroy()

    return res.status(200).json({
      success: true,
      message: "Proyecto eliminado correctamente",
    })
  } catch (error) {
    console.error("Error deleting project:", error)
    return res.status(500).json({
      success: false,
      error: "Error al eliminar el proyecto",
      details: error.message,
    })
  }
}

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  getProjectColumns,
  getProjectKanbanTasks,
  deleteProject,
}
