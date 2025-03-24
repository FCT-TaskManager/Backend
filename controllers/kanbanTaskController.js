const { KanbanTask, Column, Project } = require("../models")

// Crear una nueva tarea Kanban
const createKanbanTask = async (req, res) => {
  try {
    const { title, description, dueDate, completed, projectId, columnId, order } = req.body
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

    // Verificar que la columna exista y pertenezca al proyecto
    const column = await Column.findOne({
      where: { id: columnId, projectId },
    })

    if (!column) {
      return res.status(404).json({
        success: false,
        error: "Columna no encontrada",
      })
    }

    // Crear la tarea
    const task = await KanbanTask.create({
      title,
      description,
      dueDate,
      completed: completed || false,
      order: order || 0,
      projectId,
      columnId,
      userId,
    })

    return res.status(201).json({
      success: true,
      data: task,
    })
  } catch (error) {
    console.error("Error creating kanban task:", error)
    return res.status(500).json({
      success: false,
      error: "Error al crear la tarea kanban",
      details: error.message,
    })
  }
}

// Actualizar una tarea Kanban
const updateKanbanTask = async (req, res) => {
  try {
    const taskId = req.params.id
    const { title, description, dueDate, completed, order } = req.body
    const userId = req.user.id

    // Buscar la tarea y verificar que pertenezca a un proyecto del usuario
    const task = await KanbanTask.findOne({
      where: { id: taskId },
      include: [
        {
          model: Project,
          as: "project",
          where: { ownerId: userId },
          attributes: [],
        },
      ],
    })

    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Tarea no encontrada",
      })
    }

    // Actualizar la tarea
    await task.update({
      title: title || task.title,
      description: description !== undefined ? description : task.description,
      dueDate: dueDate !== undefined ? dueDate : task.dueDate,
      completed: completed !== undefined ? completed : task.completed,
      order: order !== undefined ? order : task.order,
    })

    return res.status(200).json({
      success: true,
      data: task,
    })
  } catch (error) {
    console.error("Error updating kanban task:", error)
    return res.status(500).json({
      success: false,
      error: "Error al actualizar la tarea kanban",
      details: error.message,
    })
  }
}

// Mover una tarea Kanban a otra columna
const moveKanbanTask = async (req, res) => {
  try {
    const taskId = req.params.id
    const { columnId, order } = req.body
    const userId = req.user.id

    // Buscar la tarea y verificar que pertenezca a un proyecto del usuario
    const task = await KanbanTask.findOne({
      where: { id: taskId },
      include: [
        {
          model: Project,
          as: "project",
          where: { ownerId: userId },
          attributes: [],
        },
      ],
    })

    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Tarea no encontrada",
      })
    }

    // Verificar que la columna exista y pertenezca al mismo proyecto
    const column = await Column.findOne({
      where: { id: columnId, projectId: task.projectId },
    })

    if (!column) {
      return res.status(404).json({
        success: false,
        error: "Columna no encontrada",
      })
    }

    // Actualizar la tarea
    await task.update({
      columnId,
      order: order !== undefined ? order : task.order,
    })

    return res.status(200).json({
      success: true,
      data: task,
    })
  } catch (error) {
    console.error("Error moving kanban task:", error)
    return res.status(500).json({
      success: false,
      error: "Error al mover la tarea kanban",
      details: error.message,
    })
  }
}

// Reordenar tareas en una columna
const reorderKanbanTasks = async (req, res) => {
  try {
    const { columnId, taskOrder } = req.body
    const userId = req.user.id

    // Verificar que la columna exista y pertenezca a un proyecto del usuario
    const column = await Column.findOne({
      where: { id: columnId },
      include: [
        {
          model: Project,
          as: "project",
          where: { ownerId: userId },
          attributes: [],
        },
      ],
    })

    if (!column) {
      return res.status(404).json({
        success: false,
        error: "Columna no encontrada",
      })
    }

    // Actualizar el orden de cada tarea
    for (let i = 0; i < taskOrder.length; i++) {
      await KanbanTask.update({ order: i }, { where: { id: taskOrder[i], columnId } })
    }

    return res.status(200).json({
      success: true,
      message: "Tareas reordenadas correctamente",
    })
  } catch (error) {
    console.error("Error reordering kanban tasks:", error)
    return res.status(500).json({
      success: false,
      error: "Error al reordenar las tareas kanban",
      details: error.message,
    })
  }
}

// Eliminar una tarea Kanban
const deleteKanbanTask = async (req, res) => {
  try {
    const taskId = req.params.id
    const userId = req.user.id

    // Buscar la tarea y verificar que pertenezca a un proyecto del usuario
    const task = await KanbanTask.findOne({
      where: { id: taskId },
      include: [
        {
          model: Project,
          as: "project",
          where: { ownerId: userId },
          attributes: [],
        },
      ],
    })

    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Tarea no encontrada",
      })
    }

    // Eliminar la tarea
    await task.destroy()

    return res.status(200).json({
      success: true,
      message: "Tarea eliminada correctamente",
    })
  } catch (error) {
    console.error("Error deleting kanban task:", error)
    return res.status(500).json({
      success: false,
      error: "Error al eliminar la tarea kanban",
      details: error.message,
    })
  }
}

module.exports = {
  createKanbanTask,
  updateKanbanTask,
  moveKanbanTask,
  reorderKanbanTasks,
  deleteKanbanTask,
}

