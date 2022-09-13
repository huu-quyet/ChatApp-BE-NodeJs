const socket = require("../../socket");
const Message = require("../models/messageModel");
const Room = require("../models/roomModel");
const catchAsync = require("../utils/catchAsync");

exports.createRoom = catchAsync(async (req, res, next) => {
  const room = await Room.create(req.body);

  res.status(201).json({ status: "success", room });
});

exports.deleteRoom = catchAsync(async (req, res, next) => {
  const room = await Room.findById(req.params.id);

  if (!room) return res.status(404).json({ status: "fail", message: "Room not found" });

  if (room && room.owner != req.body.userName) {
    res.status(400).json({ status: "fail", message: "You have not permission to do this action" });
  }
  if (room && room.owner === req.body.userName) {
    await Room.findByIdAndDelete(req.params.id);
    await Message.findByIdAndDelete([...room.message]);

    res.status(202).json({ status: "success" });
  }
});

exports.updateRoom = catchAsync(async (req, res, next) => {
  const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!room) return res.status(404).json({ status: "fail", message: "Room not found" });

  res.status(200).json({ status: "success", room });
});

exports.getRoomById = catchAsync(async (req, res, next) => {
  const room = await Room.findById(req.params.id);

  if (!room) return res.status(404).json({ status: "fail", message: "Room not found" });

  res.status(200).json({ status: "success", room });
});

exports.getAllRoomByUserId = catchAsync(async (req, res, next) => {
  const rooms = await Room.find()
    .populate({
      path: "userId lastMessage",
      select:
        "-_v -password -email -createdAt -friends -lastName -firstName -passwordCreatedAt -sendedRequire -waitingApproval -active",
    })
    .select("-message");

  if (!rooms) return res.status(404).json({ status: "fail", message: "Room not found" });
  let sortRooms = [];
  if (rooms) {
    sortRooms = rooms
      ?.filter((item) => (item?.userId?.find((user) => user._id.toString() === req.user.id) ? true : false))
      .sort((a, b) => {
        if (!a?.lastMessage || !b?.lastMessage) return 1;
        return +new Date(a.lastMessage.sendedAt) > +new Date(b.lastMessage.sendedAt) ? -1 : 1;
      });
  }

  res.status(200).json({ status: "success", rooms: sortRooms });
});
