const express = require("express");
const passport = require("passport");
const authController = require("../controllers/authControllers");
const { getRegisterPage } = require("../controllers/controllers");

const router = express.Router();

router.post("/sign-up", authController.register);
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Login error:", err);
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: info.message || "Login failed" });
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error("Session error:", err);
        return next(err);
      }
      return res.redirect('/');
    });
  })(req, res, next);
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