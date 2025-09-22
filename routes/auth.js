const express = require("express");
const passport = require("passport");
const authController = require("../controllers/authControllers");
const { getRegisterPage } = require("../controllers/controllers");

const router = express.Router();

router.post("/sign-up", authController.register);
router.post("/login", passport.authenticate("local"), (req, res) => {
  res.redirect('/');
});
router.post("/logout", authController.logout);
router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/');
  })});
router.get("/me", authController.Me);
router.get("/sign-up", getRegisterPage);

module.exports = router;