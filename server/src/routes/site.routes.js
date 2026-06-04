const express = require("express");
const { Op } = require("sequelize");
const site = require("../config/site");
const { Product, Order, User, Review, Category } = require("../models");
const { DELIVERY_FLAT, FREE_DELIVERY_FROM, PROMO_CODE, PROMO_PERCENT } = require("../utils/commerce");

const router = express.Router();

router.get("/config", (_req, res) => {
  res.json({ ...site, deliveryFlat: DELIVERY_FLAT, freeDeliveryFrom: FREE_DELIVERY_FROM, promoCode: PROMO_CODE, promoPercent: PROMO_PERCENT });
});

router.get("/stats", async (_req, res) => {
  const [productsCount, ordersCount, usersCount, reviewsCount, avgRating] = await Promise.all([
    Product.count({ where: { isPublished: true } }),
    Order.count(),
    User.count({ where: { role: "CUSTOMER" } }),
    Review.count({ where: { isPublished: true } }),
    Review.findAll({ where: { isPublished: true }, attributes: ["rating"] }),
  ]);
  const rating =
    reviewsCount > 0
      ? Math.round((avgRating.reduce((s, r) => s + r.rating, 0) / reviewsCount) * 10) / 10
      : null;

  res.json({ productsCount, ordersCount, usersCount, reviewsCount, avgRating: rating });
});

router.get("/footer-categories", async (_req, res) => {
  const names = ["Сухие смеси", "Инструмент", "Лакокрасочные материалы"];
  const categories = await Category.findAll({
    where: {
      name: { [Op.in]: names },
    },
  });
  const byName = Object.fromEntries(categories.map((c) => [c.name, c]));
  res.json(
    names.map((name) => ({
      name,
      id: byName[name]?.id || null,
      slug: byName[name]?.slug || null,
    }))
  );
});

module.exports = router;
