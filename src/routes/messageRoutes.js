const express = require("express");
const authController = require("../controller/authController");
const messageController = require("../controller/messageController");
const router = express.Router();

router.use(authController.protect);

router.route("/:roomId").get(messageController.getAllMessageInRoom);

module.exports = router;
