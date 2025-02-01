const jwt = require("jsonwebtoken");
const { validateToken } = require("../utils/tokenUtility");

const checkForAuthentication = async (req, res, next) => {
  try {
    const token =
      req.cookies.authCookie || req.headers.authorization.split(" ")[1]; // either get from local storage or authorization header

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = await validateToken(token);

    if (decoded) {
      req.user = decoded;
    }
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ status: "failed", message: "cannot verify user: " + error });
  }
};

const checkForAuthorization = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return res.status(401).json({ message: "unauthorized" });
  }
  next();
};

module.exports = { checkForAuthentication, checkForAuthorization };
