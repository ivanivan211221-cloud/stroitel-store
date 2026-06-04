const express = require("express");
const { Op, fn, col, where: sqlWhere } = require("sequelize");
const { Product, Category, Review, User } = require("../models");

const router = express.Router();

router.get("/", async (req, res) => {
  const { q = "", category = "", min = 0, max = 999999, sort = "newest" } = req.query;
  const normalizedQ = String(q).trim().toLowerCase();

  const where = {
    isPublished: true,
    price: { [Op.between]: [Number(min), Number(max)] },
  };

  if (normalizedQ) {
    where[Op.and] = [sqlWhere(fn("lower", col("title")), { [Op.like]: `%${normalizedQ}%` })];
  }
  if (category) where.categoryId = Number(category);

  const orderMap = {
    newest: [["createdAt", "DESC"]],
    priceAsc: [["price", "ASC"]],
    priceDesc: [["price", "DESC"]],
    stockDesc: [["stock", "DESC"]],
  };

  const products = await Product.findAll({
    where,
    include: [{ model: Category }],
    order: orderMap[sort] || orderMap.newest,
  });
  res.json(products);
});

router.get("/suggestions", async (req, res) => {
  const normalizedQ = String(req.query.q || "").trim().toLowerCase();
  if (!normalizedQ) return res.json([]);
  const list = await Product.findAll({
    where: {
      isPublished: true,
      [Op.and]: [sqlWhere(fn("lower", col("title")), { [Op.like]: `%${normalizedQ}%` })],
    },
    attributes: ["id", "title", "slug"],
    limit: 8,
  });
  res.json(list);
});

router.get("/:slug", async (req, res) => {
  const product = await Product.findOne({
    where: { slug: req.params.slug, isPublished: true },
    include: [
      { model: Category },
      { model: Review, where: { isPublished: true }, required: false, include: [{ model: User, attributes: ["name"] }] },
    ],
  });

  if (!product) return res.status(404).json({ message: "Товар не найден" });
  res.json(product);
});

module.exports = router;
