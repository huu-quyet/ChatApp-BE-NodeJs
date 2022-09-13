const express = require("express");

const router = express.Router();
const authController = require("../controller/authController");
const userController = require("../controller/userController");

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.post("/resetPassword/:token", authController.resetPassword);

router.use(authController.protect);

router.route("/updatePassword").post(authController.updatePassword);
router.route("/updateUserInfo").post(userController.updateUserInfo);
router.route("/friends").get(userController.getAllFriends);
router.route("/rooms/:search").get(userController.searchRooms);
router.route("/logout").post(authController.logout);
router.route("/update/activeStatus").post(userController.updateActiveStatusUser);
router.route("/searchFriends/:userName").get(userController.searchFriends);
router.route("/searchUser/:userName").get(userController.searchUserByUserName);
router.route("/unfriend/:id").put(userController.unfriend);
router.route("/sendRequire/:id").put(userController.sendRequireAddFriend);
router.route("/addFriend/:id").put(userController.addFriend);
router.route("/reject/:id").put(userController.reject);
router.route("/info").get(userController.getUsersInfo);
router.route("/notify").get(userController.getUserNotify);
router.route("/:id").get(userController.getUsersInfoById);

module.exports = router;
