const { Project, Column, KanbanTask, User } = require("../models")

// Obtener todos los proyectos
const getProjects = async (req, res) => {
  try {
    const userId = req.user.id

    // Buscar proyectos donde el usuario es propietario
    const projects = await Project.findAll({
      where: { ownerId: userId },
      order: [["createdAt", "DESC"]],
    })

    return res.status(200).json({
      success: true,
      data: projects,
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

    const project = await Project.findOne({
      where: { id: projectId, ownerId: userId },
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
      ],
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Proyecto no encontrado",
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

    // Obtener el proyecto actualizado con columnas
    const projectWithColumns = await Project.findByPk(project.id, {
      include: [
        {
          model: Column,
          as: "columns",
          order: [["order", "ASC"]],
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

    // Verificar que el proyecto pertenezca al usuario
    const project = await Project.findOne({
      where: { id: projectId, ownerId: userId },
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Proyecto no encontrado",
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

    // Verificar que el proyecto pertenezca al usuario
    const project = await Project.findOne({
      where: { id: projectId, ownerId: userId },
    })

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Proyecto no encontrado",
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

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  getProjectColumns,
  getProjectKanbanTasks,
}

