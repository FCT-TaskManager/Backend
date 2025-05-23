const { TimeEntry, Project, KanbanTask, User } = require("../models")

// Obtener todos los registros de tiempo del usuario
const getUserTimeEntries = async (req, res) => {
  try {
    const userId = req.user.id

    const timeEntries = await TimeEntry.findAll({
      where: { userId },
      order: [["startTime", "DESC"]],
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name"],
        },
        {
          model: KanbanTask,
          as: "task",
          attributes: ["id", "title"],
        },
      ],
    })

    return res.status(200).json({
      success: true,
      data: timeEntries,
    })
  } catch (error) {
    console.error("Error getting time entries:", error)
    return res.status(500).json({
      success: false,
      error: "Error al obtener los registros de tiempo",
      details: error.message,
    })
  }
}

// Crear un nuevo registro de tiempo
const createTimeEntry = async (req, res) => {
  try {
    const { description, startTime, endTime, duration, projectId, taskId } = req.body
    const userId = req.user.id

    // Validar datos
    if (!startTime) {
      return res.status(400).json({
        success: false,
        error: "La hora de inicio es requerida",
      })
    }

    // Si se proporciona projectId, verificar que exista
    if (projectId) {
      const project = await Project.findByPk(projectId)
      if (!project) {
        return res.status(404).json({
          success: false,
          error: "Proyecto no encontrado",
        })
      }
    }

    // Si se proporciona taskId, verificar que exista
    if (taskId) {
      const task = await KanbanTask.findByPk(taskId)
      if (!task) {
        return res.status(404).json({
          success: false,
          error: "Tarea no encontrada",
        })
      }
    }

    // Crear el registro de tiempo
    const timeEntry = await TimeEntry.create({
      description,
      startTime,
      endTime,
      duration,
      projectId,
      taskId,
      userId,
    })

    // Obtener el registro con las relaciones
    const timeEntryWithRelations = await TimeEntry.findByPk(timeEntry.id, {
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name"],
        },
        {
          model: KanbanTask,
          as: "task",
          attributes: ["id", "title"],
        },
      ],
    });

    return res.status(201).json({
      success: true,
      data: timeEntryWithRelations,
    })
  } catch (error) {
    console.error("Error creating time entry:", error)
    return res.status(500).json({
      success: false,
      error: "Error al crear el registro de tiempo",
      details: error.message,
    })
  }
}

// Actualizar un registro de tiempo
const updateTimeEntry = async (req, res) => {
  try {
    const timeEntryId = req.params.id
    const { description, startTime, endTime, duration, projectId, taskId } = req.body
    const userId = req.user.id

    // Buscar el registro de tiempo
    const timeEntry = await TimeEntry.findOne({
      where: { id: timeEntryId, userId },
    })

    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        error: "Registro de tiempo no encontrado",
      })
    }

    // Si se proporciona projectId, verificar que exista
    if (projectId) {
      const project = await Project.findByPk(projectId)
      if (!project) {
        return res.status(404).json({
          success: false,
          error: "Proyecto no encontrado",
        })
      }
    }

    // Si se proporciona taskId, verificar que exista
    if (taskId) {
      const task = await KanbanTask.findByPk(taskId)
      if (!task) {
        return res.status(404).json({
          success: false,
          error: "Tarea no encontrada",
        })
      }
    }

    // Actualizar el registro de tiempo
    await timeEntry.update({
      description: description !== undefined ? description : timeEntry.description,
      startTime: startTime !== undefined ? startTime : timeEntry.startTime,
      endTime: endTime !== undefined ? endTime : timeEntry.endTime,
      duration: duration !== undefined ? duration : timeEntry.duration,
      projectId: projectId !== undefined ? projectId : timeEntry.projectId,
      taskId: taskId !== undefined ? taskId : timeEntry.taskId,
    })

    // Obtener el registro actualizado con las relaciones
    const updatedTimeEntry = await TimeEntry.findByPk(timeEntry.id, {
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name"],
        },
        {
          model: KanbanTask,
          as: "task",
          attributes: ["id", "title"],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      data: updatedTimeEntry,
    })
  } catch (error) {
    console.error("Error updating time entry:", error)
    return res.status(500).json({
      success: false,
      error: "Error al actualizar el registro de tiempo",
      details: error.message,
    })
  }
}

// Eliminar un registro de tiempo
const deleteTimeEntry = async (req, res) => {
  try {
    const timeEntryId = req.params.id
    const userId = req.user.id

    // Buscar el registro de tiempo
    const timeEntry = await TimeEntry.findOne({
      where: { id: timeEntryId, userId },
    })

    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        error: "Registro de tiempo no encontrado",
      })
    }

    // Eliminar el registro de tiempo
    await timeEntry.destroy()

    return res.status(200).json({
      success: true,
      message: "Registro de tiempo eliminado correctamente",
    })
  } catch (error) {
    console.error("Error deleting time entry:", error)
    return res.status(500).json({
      success: false,
      error: "Error al eliminar el registro de tiempo",
      details: error.message,
    })
  }
}

module.exports = {
  getUserTimeEntries,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
}