const express = require("express");
const router = express.Router();
const {
  handleUserRegister,
  handleUserLogin,
  handleGetUserDetail,
} = require("../controller/userController");
const { checkForAuthorization } = require("../middleware/authentication");

// setting up user router
router.post("/register", handleUserRegister);
router.post("/login", handleUserLogin);

// after logging in
router.get("/profile/:id", handleGetUserDetail);

module.exports = router;
