const express = require("express");
const { verifyUser, adminOnly } = require("../middleware/verifyAuth");
const {
  getAllEmployee,
  createEmployee,
  updateEmployee,
} = require("../controllers/employee");

const router = express.Router();

router.get("/all", verifyUser, adminOnly, getAllEmployee);
router.post("/add", verifyUser, adminOnly, createEmployee);
router.patch("/update/:uuid", verifyUser, adminOnly, updateEmployee);

module.exports = router;
