const { PrismaClient } = require("../generated/prisma");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

exports.register = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { 
        email, 
        username: username || email.split('@')[0], // Use part of email as username if not provided
        password: hashed 
      },
    });

    // Log the user in after registration
    req.logIn(user, (err) => {
      if (err) {
        console.error("Auto-login error:", err);
        return res.redirect('/');
      }
      res.redirect('/');
    });
  } catch (err) {
    console.error("Registration error:", err);
    if (err.code === 'P2002') {
      return res.status(400).json({ error: "Email or username already exists" });
    }
    res.status(500).json({ error: "Registration failed" });
  }
};

exports.logout = (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.json({ message: "Logged out" });
  });
};

exports.Me = (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Not logged in" });
  res.json(req.user);
};
