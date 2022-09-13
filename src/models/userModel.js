const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { stringify } = require("querystring");

const UserSchema = mongoose.Schema({
  firstName: {
    type: String,
    select: true,
  },
  lastName: {
    type: String,
    select: true,
  },
  birthday: {
    type: Date,
    select: true,
  },
  userName: {
    type: String,
    unique: true,
    require: [true, "Please provide us your user name"],
  },
  avatar: String,
  email: {
    type: String,
    require: [true, "Please provide us your email"],
    unique: true,
    lowerCase: true,
    validator: [validator.email, "Please provide a valid email"],
  },
  phone: {
    type: String,
  },
  friends: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  password: {
    type: String,
    require: [true, "Please provide a password"],
    minlength: 8,
    select: true,
  },
  passwordConfirm: {
    type: String,
    require: [true, "Please confirm your password"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Password are not the same",
    },
  },
  active: {
    type: Boolean,
    default: false,
  },
  online: {
    type: Boolean,
    default: false,
  },
  waitingApproval: {
    type: [String],
    default: [],
  },
  sendedRequire: {
    type: [String],
    default: [],
  },
  lastTimeOnline: Date,
  passwordCreatedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

// Encrypt password
UserSchema.pre("save", async function (next) {
  // only run this function if password was actually modified
  if (!this.isModified("password")) return next();

  // Hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete password confirm
  this.passwordConfirm = undefined;

  next();
});

// UserSchema.pre(/^find/, function (next) {
//   this.select("-password -createdAt -__v -email -passwordCreatedAt");
//   next();
// });

UserSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordCreatedAt = Date.now() - 1000;
  next();
});

UserSchema.methods.changedPasswordAfter = function (JWTCreatedAt) {
  if (this.passwordCreatedAt) {
    const createdAt = this.passwordCreatedAt.getTime() / 1000;
    return JWTCreatedAt < createdAt;
  }
  return false;
};

UserSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordCreatedAt = Date.now() - 1000;
  next();
});

UserSchema.methods.correctPassword = async function (loginPassword, userPassword) {
  return await bcrypt.compare(loginPassword, userPassword);
};

UserSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", UserSchema);

module.exports = User;
