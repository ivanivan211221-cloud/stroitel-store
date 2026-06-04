const express = require("express");
const { z } = require("zod");
const { Review, Product } = require("../models");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.post("/:productId", auth, async (req, res) => {
  const schema = z.object({
    rating: z.number().min(1).max(5),
    text: z.string().min(5),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Ошибка валидации" });

  const product = await Product.findByPk(req.params.productId);
  if (!product) return res.status(404).json({ message: "Товар не найден" });

  const existing = await Review.findOne({ where: { productId: product.id, userId: req.user.id } });
  if (existing) return res.status(409).json({ message: "Вы уже оставляли отзыв на этот товар" });

  const review = await Review.create({
    productId: product.id,
    userId: req.user.id,
    rating: parsed.data.rating,
    text: parsed.data.text,
    isPublished: false,
  });
  res.status(201).json({ message: "Отзыв отправлен на модерацию", reviewId: review.id });
});

module.exports = router;
