const mongoose = require("mongoose");

const RoomSchema = mongoose.Schema(
  {
    name: {
      type: String,
      require: [true, "Room'name is required!"],
    },
    userId: {
      type: [mongoose.Schema.ObjectId],
      ref: "User",
      require: [true, "The room is required at least two people"],
    },
    nickName: {
      type: [{ userId: Number, name: String }],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    message: [String],
    lastMessage: {
      type: mongoose.Schema.ObjectId,
      ref: "Message",
    },
    unRead: {
      type: [String],
      default: [],
    },
    updatedAt: {
      type: Date,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    versionKey: false,
  }
);

const Room = mongoose.model("Room", RoomSchema);

module.exports = Room;
