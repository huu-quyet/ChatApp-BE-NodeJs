const User = require("../models/userModel");
const Rooms = require("../models/roomModel");
const catchAsync = require("../utils/catchAsync");
const formatTex = require("../utils/functions");

exports.getAllFriends = catchAsync(async (req, res, next) => {
  const friends = await User.find({ $and: [{ _id: { $ne: req.user.id } }, { _id: req.user.friends }] }).select(
    "-friends -password -createdAt -__v -email -passwordCreatedAt"
  );

  res.status(200).json({ status: "success", data: friends });
});

exports.sendRequireAddFriend = catchAsync(async (req, res, next) => {
  Promise.all([User.findById(req.user.id), User.findById(req.params.id)])
    .then(async (data) => {
      data[0].sendedRequire = [...data[0].sendedRequire, data[1]._id];
      data[1].waitingApproval = [...data[1].waitingApproval, data[0]._id];

      await data[0].save();
      await data[1].save();

      res.status(200).json({ status: "success", data: { user: data[0] } });
    })
    .catch((err) => res.status(404).json({ status: "fail", message: err.message }));
});

exports.addFriend = catchAsync(async (req, res, next) => {
  Promise.all([User.findById(req.user.id), User.findById(req.params.id)])
    .then(async (data) => {
      data[0].friends = [...data[0].friends, data[1]._id];
      data[1].friends = [...data[1].friends, data[0]._id];
      data[0].waitingApproval = data[0].waitingApproval.filter((item) => item != req.params.id);
      data[0].sendedRequire = data[0].sendedRequire.filter((item) => item != req.params.id);
      data[1].sendedRequire = data[1].sendedRequire.filter((item) => item != req.user.id);
      data[1].waitingApproval = data[1].waitingApproval.filter((item) => item != req.params.id);

      await data[0].save();
      await data[1].save();

      res.status(200).json({ status: "success", data: { user: data[0] } });
    })
    .catch((err) => res.status(404).json({ status: "fail", message: err.message }));
});

exports.unfriend = catchAsync(async (req, res, next) => {
  Promise.all([User.findById(req.user.id), User.findById(req.params.id)])
    .then(async (data) => {
      data[0].friends = data[0].friends.filter((fr) => fr != data[1]._id);
      data[1].friends = data[1].friends.filter((fr) => fr != data[0]._id);

      await data[0].save();
      await data[1].save();

      res.status(200).json({ status: "success", data: { user: data[0] } });
    })
    .catch((err) => res.status(401).json({ status: "fail", message: err.message }));
});

exports.reject = catchAsync(async (req, res, next) => {
  Promise.all([User.findById(req.user.id), User.findById(req.params.id)])
    .then(async (data) => {
      data[0].waitingApproval = data[0].waitingApproval.filter((item) => item != req.params.id);
      data[1].sendedRequire = data[1].sendedRequire.filter((item) => item != req.user.id);

      await data[0].save();
      await data[1].save();

      res.status(200).json({ status: "success", data: { user: data[0] } });
    })
    .catch((err) => res.status(401).json({ status: "fail", message: err.message }));
});

exports.updateActiveStatusUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  user.online = req.body.online;
  await user.save();
  user.password = undefined;

  res.status(200).json({ status: "success", user });
});

exports.updateUserInfo = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user.id, req.body, { new: true, runValidators: true });

  if (!user) {
    return res.status(404).json({ status: "fail", message: "Some thing went wrong" });
  }

  res.status(200).json({ status: "success", user });
});

exports.searchRooms = catchAsync(async (req, res, next) => {
  const rooms = await Rooms.find().populate({
    path: "userId",
  });

  let sortRooms = [];

  if (rooms) {
    sortRooms = rooms?.filter((item) =>
      item?.userId?.find((user) => user._id?.toString() === req.user.id) &&
      formatTex(item?.name)?.includes(formatTex(req.params?.search))
        ? true
        : false
    );
  }

  res.status(200).json({ status: "success", rooms: sortRooms });
});

exports.searchFriends = catchAsync(async (req, res, next) => {
  const users = await User.find({
    $and: [
      {
        _id: { $in: req.user.friends },
      },
      { _id: { $ne: req.user.id } },
    ],
    userName: { $regex: req.params?.userName, $options: "i" },
  }).select("-lastName -firstName -birthday -friends -phone -password -createdAt -__v -email -passwordCreatedAt");

  res.status(200).json({ status: "success", users });
});

exports.searchUserByUserName = catchAsync(async (req, res, next) => {
  const users = await User.find({
    _id: { $ne: req.user.id },
    userName: { $regex: req.params.userName, $options: "i" },
  }).select("-friends -password -createdAt -__v -email -passwordCreatedAt");

  res.status(200).json({ status: "success", users });
});

exports.getUsersInfo = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("-password -createdAt -__v -passwordCreatedAt");

  if (!user) {
    return res.status(404).json({ status: "fail", message: "Some thing went wrong" });
  }

  res.status(200).json({ status: "success", user });
});

exports.getUsersInfoById = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select("-friends -password -createdAt -__v -passwordCreatedAt");

  if (!user) {
    return res.status(404).json({ status: "fail", message: "Some thing went wrong" });
  }

  res.status(200).json({ status: "success", user });
});

exports.getUserNotify = catchAsync(async (req, res, next) => {
  const users = await User.find({ _id: { $in: [...req.user.waitingApproval] } }).select(
    "-friends -password -createdAt -__v -email -passwordCreatedAt -waitingApproval -sendedRequire -lastTimeOnline"
  );

  res.status(200).json({ status: "success", waitingApproval: users });
});
