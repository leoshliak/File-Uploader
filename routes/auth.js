const express = require("express");
const passport = require("passport");
const authController = require("../controllers/authControllers");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", passport.authenticate("local"), (req, res) => {
  res.json({ message: "Logged in", user: req.user });
});
router.post("/logout", authController.logout);
router.get("/me", authController.Me);

module.exports = router;