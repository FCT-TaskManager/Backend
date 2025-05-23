const express = require("express")
const router = express.Router()
const timeEntryController = require("../controllers/timeEntryController")
const { protect } = require("../middleware/auth")

// Aplicar middleware de autenticación a todas las rutas
router.use(protect)

// Rutas de registros de tiempo
router.route("/")
  .get(timeEntryController.getUserTimeEntries)
  .post(timeEntryController.createTimeEntry)

router.route("/:id")
  .put(timeEntryController.updateTimeEntry)
  .delete(timeEntryController.deleteTimeEntry)

module.exports = router