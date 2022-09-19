const User = require("./src/models/userModel");
const Room = require("./src/models/roomModel");
const Message = require("./src/models/messageModel");
const EVENTS = {
  connection: "connection",
  CLIENT: {
    USER_CONNECTION: "USER_CONNECTION",
    CREATE_ROOM: "CREATE_ROOM",
    SEND_MESSAGE: "SEND_MESSAGE",
    JOIN_ROOM: "JOIN_ROOM",
    SEND_REQUIRE: "SEND_REQUIRE",
    LOAD_MORE_MESSAGE: "LOAD_MORE_MESSAGE",
    LEAVE_ROOM: "LEAVE_ROOM",
    UPDATE_ROOM: "UPDATE_ROOM",
  },
  SERVER: {
    ROOMS: "ROOMS",
    NEW_ROOM: "NEW_ROOM",
    JOINED_ROOM: "JOINED_ROOM",
    ROOM_MESSAGE: "ROOM_MESSAGE",
    WAITING_APPROVAL: "WAITING_APPROVAL",
    NEW_REQUIRE_ADD_FRIEND: "NEW_REQUIRE_ADD_FRIEND",
    RESPONSE_LOAD_MORE_MESSAGE: "RESPONSE_LOAD_MORE_MESSAGE",
    UPDATE_ROOM: "UPDATE_ROOM",
  },
};

let onlineUsers = [];

const socket = ({ io }) => {
  io.on(EVENTS.connection, (socket) => {
    // Save user socketId
    socket.on(EVENTS.CLIENT.USER_CONNECTION, (userId, socketId) => {
      const userExisted = onlineUsers?.findIndex((item) => item.userId === userId);
      if (userExisted != -1) {
        onlineUsers[userExisted].socketId = socketId;
      } else {
        onlineUsers = [...onlineUsers, { userId: userId, socketId, socketId }];
      }
    });

    // Event send require add friend
    socket.on(EVENTS.CLIENT.SEND_REQUIRE, ({ sender, to }, callback) => {
      Promise.all([User.findById(sender), User.findById(to)]).then(async (user) => {
        user[0].sendedRequire = [...user[0].sendedRequire, user[1]._id];
        user[1].waitingApproval = [...user[1].waitingApproval, user[0]._id];

        await user[0].save();
        await user[1].save();

        callback({ sender: sender, senderInfo: user[0], receiver: to, receiverInfo: user[1] });

        const onlineUser = onlineUsers?.find((item) => item.userId === user[1]?._id.toString());

        if (onlineUser) {
          socket.to(onlineUser.socketId).emit(EVENTS.SERVER.NEW_REQUIRE_ADD_FRIEND, {
            sender: sender,
            senderInfo: user[0],
            receiver: to,
            receiverInfo: user[1],
          });
        }
      });
    });

    // Event create room
    socket.on(EVENTS.CLIENT.CREATE_ROOM, async ({ userCreate, name, userId, message }, callback) => {
      const newRoom = await Room.create({ name: name, userId: [...userId, userCreate], message: message });

      const room = await Room.findById(newRoom._id).populate({
        path: "userId",
        select:
          "-_v -password -email -createdAt -friends -lastName -firstName -passwordCreatedAt -sendedRequire -waitingApproval -active",
      });
      callback(room);

      const onlineUser = onlineUsers?.filter((item) => userId?.includes(item.userId));

      onlineUser.forEach((user) => {
        socket.to(`${user.socketId}`).emit(EVENTS.SERVER.NEW_ROOM, room);
      });
    });

    // Event join room
    socket.on(EVENTS.CLIENT.JOIN_ROOM, async (currentRoomId, roomId, socketId, userId, callback) => {
      if (currentRoomId) {
        socket.leave(currentRoomId);
      }

      if (roomId) {
        socket.join(roomId);

        const userOnlineExisted = onlineUsers?.findIndex((item) => item.socketId === socketId);

        if (userOnlineExisted !== -1) {
          onlineUsers[userOnlineExisted] = {
            userId: onlineUsers[userOnlineExisted].userId,
            socketId: socketId,
            room: roomId,
          };
        }

        const messages = await Message.find({ receiver: roomId })
          .populate({
            path: "sender",
            select:
              "-_v -password -email -createdAt -friends -lastName -firstName -passwordCreatedAt -sendedRequire -waitingApproval -active",
          })
          .sort("-sendedAt")
          .skip(0)
          .limit(30);

        messages.sort((a, b) => +new Date(a.sendedAt) - +new Date(b.sendedAt));

        const room = await Room.findById(roomId);
        const unRead = room?.unRead?.filter((id) => id.toString() !== userId.toString()) | [];
        room.unRead = unRead;

        await room.save();

        callback({ messages, room });
      }
    });

    // Event send message
    socket.on(EVENTS.CLIENT.SEND_MESSAGE, async (mes, callback) => {
      if (mes) {
        const newMes = await Message.create(mes);
        const room = await Room.findById({ _id: mes.receiver }).populate({
          path: "userId",
          select:
            "-__v -password -email -createdAt -friends -lastName -firstName -passwordCreatedAt -sendedRequire -waitingApproval -active",
        });
        const newMessageId = [...room.message, newMes._id];
        room.message = newMessageId;

        const onlineMembers = onlineUsers.filter((user) => room?.userId?.find((u) => u._id.toString() === user.userId));

        const userUnReadMes = [];

        onlineMembers.forEach((user) => {
          room?._id.toString() !== user?.room && userUnReadMes.push(user.userId);
        });

        room.unRead = userUnReadMes;
        room.updatedAt = Date.now();

        const newMessInfo = await Message.findById({ _id: newMes._id }).populate({
          path: "sender",
          select:
            "-__v -password -email -createdAt -friends -lastName -firstName -passwordCreatedAt -sendedRequire -waitingApproval -active",
        });
        room.lastMessage = newMessInfo;

        await room.save();

        callback({ room, newMessInfo });

        onlineMembers.forEach((user) => {
          socket.to(`${user.socketId}`).emit(EVENTS.SERVER.ROOM_MESSAGE, room, newMessInfo);
        });
      }
    });

    // Event load more message
    socket.on(EVENTS.CLIENT.LOAD_MORE_MESSAGE, async (param, callback) => {
      const messages = await Message.find({ receiver: param.roomId })
        .populate({
          path: "sender",
          select:
            "-_v -password -email -createdAt -friends -lastName -firstName -passwordCreatedAt -sendedRequire -waitingApproval -active",
        })
        .sort("-sendedAt")
        .skip(param.skip)
        .limit(30);
      messages.sort((a, b) => +new Date(a.sendedAt) - +new Date(b.sendedAt));
      callback(messages);
    });

    // Event leave room
    socket.on(EVENTS.CLIENT.LEAVE_ROOM, async (roomId, socketId) => {
      if (roomId) {
        socket.leave(roomId);

        const userOnlineExisted = onlineUsers?.findIndex((item) => item.socketId === socketId);

        if (userOnlineExisted !== -1) {
          onlineUsers[userOnlineExisted] = {
            userId: onlineUsers[userOnlineExisted].userId,
            socketId: socketId,
            room: null,
          };
        }
      }
    });

    // Event update room
    socket.on(EVENTS.CLIENT.UPDATE_ROOM, async (roomId, body, callback) => {
      if (roomId && body) {
        const room = await Room.findByIdAndUpdate(roomId, body, {
          new: true,
          runValidators: true,
        });

        if (room) {
          callback();
        }
      }
    });
  });
};

module.exports = socket;
