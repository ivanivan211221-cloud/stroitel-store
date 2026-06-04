const express = require("express");
const { z } = require("zod");
const { ContactMessage } = require("../models");

const router = express.Router();

router.post("/", async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    message: z.string().min(10),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Ошибка валидации" });

  const msg = await ContactMessage.create(parsed.data);
  res.status(201).json({ id: msg.id, message: "Сообщение отправлено" });
});

module.exports = router;
