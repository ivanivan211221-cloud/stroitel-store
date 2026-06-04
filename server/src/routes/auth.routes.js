const express = require("express");
const bcrypt = require("bcryptjs");
const { z } = require("zod");
const { User } = require("../models");
const { signToken } = require("../utils/jwt");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.post("/register", async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Ошибка валидации" });

  const exists = await User.findOne({ where: { email: parsed.data.email } });
  if (exists) return res.status(409).json({ message: "Email уже используется" });

  const user = await User.create(parsed.data);
  const token = signToken({ id: user.id, role: user.role });
  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, role: user.role, email: user.email, promoUsed: user.promoUsed },
    promoCode: "FIRST10",
  });
});

router.post("/login", async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Ошибка валидации" });

  const user = await User.findOne({ where: { email: parsed.data.email } });
  if (!user || user.isBlocked) return res.status(401).json({ message: "Неверные данные" });
  const ok = await bcrypt.compare(parsed.data.password, user.password);
  if (!ok) return res.status(401).json({ message: "Неверные данные" });
  const token = signToken({ id: user.id, role: user.role });
  res.json({
    token,
    user: { id: user.id, name: user.name, role: user.role, email: user.email, promoUsed: user.promoUsed },
  });
});

router.get("/me", auth, async (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    promoUsed: req.user.promoUsed,
  });
});

module.exports = router;
