const jwt = require("jsonwebtoken");
const secretKey = process.env.JWT_SECRET_KEY;

const generateAuthToken = async (user) => {
  const payload = {
    username: user.username,
    id: user._id,
    email: user.email,
    role: user.role,
  };

  const token = await jwt.sign(payload, secretKey, {
    expiresIn: "7d",
    algorithm: "HS512",
  });

  return token;
};

const validateToken = async (token) => {
  try {
    const valid = jwt.verify(token, secretKey, { complete: true });
    return valid;
  } catch (error) {
    throw new Error("some validation error");
  }
};

module.exports = { generateAuthToken, validateToken };
