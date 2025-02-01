const User = require("../model/userModel");
const AppError = require("../utils/errorApi");

const bcrypt = require("bcrypt");
const { generateAuthToken } = require("../utils/tokenUtility");

// todo: need to hash the password before saving to the database

const handleUserRegister = async (req, res, next) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(404).json({ msg: "every field is mandatory" });
  }

  try {
    const hash = await bcrypt.hash(password, Number(process.env.SALT_ROUNDS));

    if (!hash) {
      throw new Error("Cannot create hash..!!");
    }

    const user = new User({
      username,
      email,
      password: hash,
    });

    await user.save();

    return res.status(200).json({ status: "success", createdUser: user });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.httpCode).json(error.toResponse());
    } else {
      // handle unexpected errors
      res.status(500).json({
        error: {
          name: "InternalServerError",
          message: `something went wrong ${error}`,
          httpCode: 500,
        },
      });
    }
  }
};

const handleUserLogin = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(404).json({ msg: "fields cannot be empty" });
  }

  try {
    // check the user available with the provided email
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("ResourceNotFoundError", 404, "user not found", true);
    }

    // if yes, compare the password with the hashed password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new Error(
        "ResourceNotFoundError",
        404,
        "password didn't match",
        true
      );
    }

    // if matched, generate a session cookie(jwt) as an auth token
    const authToken = await generateAuthToken(user);

    // send the token in the response object for later authentication purposes
    // send the response to the user
    return res
      .status(200)
      .cookie("authCookie", authToken, {
        httpOnly: true,
        // secure: process.env.NODE_ENV === "production",
        // sameSite: "strict",
      })
      .json({
        status: "success",
        message: "logged in",
        authToken: "",
        data: user,
      });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.httpCode).json(error.toResponse());
    } else {
      // handle unexpected errors
      res.status(500).json({
        error: {
          name: "InternalServerError",
          message: "something went wrong: " + error,
          httpCode: 500,
        },
      });
    }
  }
};

// user profile after log ging in
const handleGetUserDetail = async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    throw new AppError("ParameterMissing", 400, "userid missing", true);
  }

  try {
    const user = await User.findOne({ _id: id });

    if (!user) {
      throw new AppError("ResourceNotFoundError", 404, "User not found", true);
    }

    return res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(err.httpCode).json(error.toResponse());
    } else {
      res.status(500).json({
        error: {
          name: "InternalServerError",
          message: `Something went wrong: ${error}`,
          httpCode: 500,
        },
      });
    }
  }
};

module.exports = {
  handleGetUserDetail,
  handleUserLogin,
  handleUserRegister,
};
