const express = require("express");
const authController = require("../controller/authController");
const roomController = require("../controller/roomController");

const router = express.Router();

router.use(authController.protect);

router.get("/", roomController.getAllRoomByUserId);
router.post("/create", roomController.createRoom);
router.route("/:id").delete(roomController.deleteRoom).put(roomController.updateRoom).get(roomController.getRoomById);

module.exports = router;
