const express = require("express");
const { Favorite, Product, Category } = require("../models");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.use(auth);

router.get("/", async (req, res) => {
  const rows = await Favorite.findAll({
    where: { userId: req.user.id },
    include: [{ model: Product, include: [Category] }],
    order: [["createdAt", "DESC"]],
  });
  res.json(rows.map((r) => r.Product).filter(Boolean));
});

router.post("/:productId", async (req, res) => {
  const productId = Number(req.params.productId);
  const product = await Product.findOne({ where: { id: productId, isPublished: true } });
  if (!product) return res.status(404).json({ message: "Товар не найден" });

  const [row] = await Favorite.findOrCreate({ where: { userId: req.user.id, productId } });
  res.status(201).json({ id: row.id, productId });
});

router.delete("/:productId", async (req, res) => {
  await Favorite.destroy({ where: { userId: req.user.id, productId: Number(req.params.productId) } });
  res.status(204).send();
});

module.exports = router;
