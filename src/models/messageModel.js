const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema(
  {
    content: {
      type: String,
      require: [true, "Message is required content"],
    },
    type: {
      type: String,
      enum: ["text", "img", "video", "link", "icon"],
    },
    path: {
      type: String,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: [true, "The message must have belonged to a user"],
    },
    sendedAt: {
      type: Date,
      require: [true, "The message must have sended time"],
    },
    receivedAt: {
      type: Date,
      default: new Date(Date.now()),
    },
    receiver: {
      type: String,
      require: [true, "The message must have belonged to a room"],
    },
  },
  { versionKey: false }
);

const Message = mongoose.model("Message", MessageSchema);

module.exports = Message;
