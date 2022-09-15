const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { promisify } = require("util");
const sendEmail = require("../utils/email");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: 90 * 24 * 60 * 60,
  });

const createToken = (data, statusCode, res) => {
  const token = signToken(data._id);
  const cookieOptions = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  //remove password
  data.password = undefined;

  res
    .status(statusCode)
    .json({ status: "success", token, data, expireTime: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) });
};

exports.signup = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    return res.status(400).json({ status: "fail", message: "This email existed" });
  }
  const newUser = await User.create(req.body);

  createToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ status: "fail", message: "Please provide email and password" });

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return res.status(400).json({ status: "fail", message: "Password or Email not correct" });
  }

  user.online = true;
  await user.save();

  createToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //1. Getting token and check of it's exits
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bear")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401).json({ status: "fail", message: "You are not logged in!" });
    next();
  }
  //2. Verification token
  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3. Check if user still exists
  const freshUser = await User.findById(decode.id);
  if (!freshUser) {
    res.status(401).json({ status: "fail", message: "'The user belonging to this token does no longer exits'" });
    next();
  }
  //4. Check if user changed password after the token was issued
  if (freshUser.changedPasswordAfter(decode.iat)) {
    res.status(401).json({ status: "fail", message: "Your recently login. Please login again!" });
    next();
  }
  // GRANT ACCESS THIS ROUTE
  req.user = freshUser;
  next();
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //Get user
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(404).json({ status: "fail", message: "Not found user by that email" });
  }

  //Generate the random reset token
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  //Send email to user's email
  const resetUrl = `https://chatapp-47da7.web.app/reset-password/${resetToken}`;

  const message = `Forgot your password\nSubmit a PATCH request with your new password and password confirm to: ${resetUrl}\nIf you don't want to forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Reset your password (Expires in 10 minutes)",
      message,
    });

    res.status(200).json({ status: "success", message: "Token sent to email" });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return res
      .status(500)
      .json({ status: "error", message: "There was an error sending this email, please try again!" });
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gte: Date.now() },
  });

  if (!user) {
    return res.status(404).json({ status: "error", message: "Token invalid or has expires!" });
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  createToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return res.status(404).json({ status: "error", message: "Your current password not correct!" });
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  createToken(user, 200, res);
});

exports.logout = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user.online) {
    user.online = true;
    await user.save();
  } else {
    user.online = false;
    user.lastTimeOnline = Date.now();
    await user.save();
  }
  res.status(200).json({ status: "success", message: "You were log out!" });
});
