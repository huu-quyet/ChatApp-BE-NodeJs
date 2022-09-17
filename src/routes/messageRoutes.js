const express = require("express");
const authController = require("../controller/authController");
const router = express.Router();

router.use(authController.protect);

module.exports = router;
