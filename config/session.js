const session = require("express-session");
const { PrismaClient } = require("../generated/prisma");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");

const prisma = new PrismaClient();

exports.sessionMiddLeware = session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // 1 week
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, 
      dbRecordIdIsSessionId: true,
    }),
})
