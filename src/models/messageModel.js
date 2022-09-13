const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema({
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
    // validate: {
    //   validator: function (el) {
    //     return (this.type === "img" || this.type === "video" || this.link === "link" || this.type === "icon") && el;
    //   },

    //   message: "This text is not allow type message",
    // },
  },
  sender: {
    type: {
      id: String,
      userName: String,
      avatar: String,
    },
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
});

const Message = mongoose.model("Message", MessageSchema);

module.exports = Message;
