const express = require("express");
const router = express.Router();
const {
  handleUserRegister,
  handleUserLogin,
  handleGetUserDetail,
  handleChangePassword,
} = require("../controller/userController");
const {
  checkForAuthorization,
  checkForAuthentication,
} = require("../middleware/authentication");

// setting up user router
router.post("/register", handleUserRegister);
router.post("/login", handleUserLogin);

// after logging in
router.get("/profile/:id", handleGetUserDetail);

// change/reset password
router.post("/reset/password", checkForAuthentication, handleChangePassword);

module.exports = router;
