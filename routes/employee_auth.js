const express = require("express");
const {
  signUpEmployee,
  signInEmployee,
  signOutEmployee,
} = require("../controllers/employee_authentication");

const router = express.Router();

router.post("/signup", signUpEmployee);
router.post("/signin", signInEmployee);
router.delete("/signout", signOutEmployee);

module.exports = router;
