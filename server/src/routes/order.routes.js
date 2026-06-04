const express = require("express");
const { z } = require("zod");
const { Order, OrderItem, Product } = require("../models");
const { auth } = require("../middleware/auth");
const { createOrder } = require("../services/orderService");
const { PROMO_CODE } = require("../utils/commerce");

const router = express.Router();
router.use(auth);

const orderBodySchema = z.object({
  customerName: z.string().min(2),
  phone: z.string().min(6),
  address: z.string().min(5),
  paymentMethod: z.enum(["CARD", "CASH"]),
  promoCode: z.string().optional(),
  items: z.array(z.object({ productId: z.number(), qty: z.number().int().positive() })).min(1),
});

router.post("/", async (req, res) => {
  const parsed = orderBodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Ошибка валидации" });

  try {
    const order = await createOrder({ userId: req.user.id, ...parsed.data });
    res.status(201).json({
      orderId: order.id,
      subtotal: order.subtotal,
      discount: order.discount,
      deliveryFee: order.deliveryFee,
      total: order.total,
      status: order.status,
    });
  } catch (err) {
    const status = err.status || 400;
    res.status(status).json({ message: err.message || "Не удалось создать заказ" });
  }
});

router.post("/quick", async (req, res) => {
  const schema = z.object({
    productId: z.number(),
    customerName: z.string().min(2),
    phone: z.string().min(6),
    address: z.string().min(5),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Ошибка валидации" });

  try {
    const order = await createOrder({
      userId: req.user.id,
      customerName: parsed.data.customerName,
      phone: parsed.data.phone,
      address: parsed.data.address,
      paymentMethod: "CASH",
      items: [{ productId: parsed.data.productId, qty: 1 }],
      note: "Заказ в 1 клик",
    });
    res.status(201).json({ orderId: order.id, total: order.total, status: order.status });
  } catch (err) {
    res.status(400).json({ message: err.message || "Не удалось оформить заказ" });
  }
});

router.get("/promo-info", (req, res) => {
  res.json({
    code: PROMO_CODE,
    percent: 10,
    available: !req.user.promoUsed,
    hint: req.user.promoUsed ? "Промокод уже использован" : "Скидка 10% на первый заказ",
  });
});

router.get("/my", async (req, res) => {
  const orders = await Order.findAll({
    where: { userId: req.user.id },
    include: [{ model: OrderItem, include: [{ model: Product, attributes: ["title", "image", "slug"] }] }],
    order: [["createdAt", "DESC"]],
  });
  res.json(orders);
});

module.exports = router;
