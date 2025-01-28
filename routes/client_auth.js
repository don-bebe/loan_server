const express = require("express");
const {
  signinClient,
  signOutClient,
  getClientDetails,
} = require("../controllers/client_authentication");
const { verifyClient } = require("../middleware/verifyClient");

const router = express.Router();

router.get("/me", verifyClient, getClientDetails);
router.post("/signin", signinClient);
router.delete("/signout", signOutClient);

module.exports = router;
