const express = require("express");
const { Op, fn, col, where: sqlWhere } = require("sequelize");
const { z } = require("zod");
const { parse } = require("csv-parse/sync");
const { auth, allowRoles } = require("../middleware/auth");
const { sequelize, User, Product, Order, Category, Review, OrderItem, ContactMessage, Favorite } = require("../models");
const { restoreOrderStock } = require("../services/orderService");
const { slugify } = require("../utils/helpers");
const { uniqueSlug } = require("../utils/uniqueSlug");
const { deleteLocalUpload } = require("../utils/uploads");

const router = express.Router();

router.use(auth, allowRoles("ADMIN", "MANAGER", "CONTENT_MANAGER"));

router.get("/dashboard", async (_req, res) => {
  const [ordersCount, usersCount, productsCount, reviewsPending] = await Promise.all([
    Order.count(),
    User.count(),
    Product.count(),
    Review.count({ where: { isPublished: false } }),
  ]);

  const latestOrders = await Order.findAll({ limit: 6, order: [["createdAt", "DESC"]] });
  const totalRevenue = await Order.sum("total", { where: { isPaid: true } });

  res.json({
    stats: { ordersCount, usersCount, productsCount, reviewsPending, totalRevenue: Number(totalRevenue || 0) },
    latestOrders,
  });
});

router.get("/products", async (req, res) => {
  const normalizedQ = String(req.query.q || "").trim().toLowerCase();
  const where = normalizedQ
    ? { [Op.and]: [sqlWhere(fn("lower", col("title")), { [Op.like]: `%${normalizedQ}%` })] }
    : {};
  const products = await Product.findAll({ where, include: [Category], order: [["createdAt", "DESC"]] });
  res.json(products);
});

router.get("/products/export/csv", allowRoles("ADMIN", "MANAGER"), async (_req, res) => {
  const products = await Product.findAll({ include: [Category], order: [["id", "ASC"]] });
  const header = "id,title,slug,price,stock,category\n";
  const rows = products
    .map((p) => `${p.id},"${String(p.title).replace(/"/g, '""')}",${p.slug},${p.price},${p.stock},"${p.Category?.name || ""}"`)
    .join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=products.csv");
  res.send(header + rows);
});

router.post("/products/import/csv", allowRoles("ADMIN", "MANAGER"), async (req, res) => {
  const schema = z.object({ csv: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Ошибка валидации" });

  const records = parse(parsed.data.csv, { columns: true, skip_empty_lines: true, trim: true });
  let imported = 0;
  for (const record of records) {
    const title = record.title?.trim();
    if (!title) continue;
    const categoryName = record.category || "Без категории";
    const [category] = await Category.findOrCreate({
      where: { slug: slugify(categoryName) },
      defaults: { name: categoryName, slug: slugify(categoryName) },
    });
    await Product.findOrCreate({
      where: { slug: record.slug?.trim() || slugify(title) },
      defaults: {
        title,
        slug: record.slug?.trim() || slugify(title),
        description: record.description || `Товар ${title}`,
        price: Number(record.price) || 0,
        stock: Number(record.stock) || 0,
        categoryId: category.id,
      },
    });
    imported += 1;
  }
  res.json({ imported });
});

const validationMessage = (parsed) => {
  const issue = parsed.error.issues[0];
  if (!issue) return "Ошибка валидации";
  const field = issue.path?.[0];
  if (field === "price") return "Цена должна быть больше 0";
  if (field === "categoryId") return "Выберите категорию";
  if (field === "description") return "Описание: минимум 10 символов";
  if (field === "title") return "Название: минимум 3 символа";
  if (field === "image") return "Ссылка на фото должна начинаться с http:// или https://";
  return issue.message || "Ошибка валидации";
};

router.post("/products", allowRoles("ADMIN", "MANAGER", "CONTENT_MANAGER"), async (req, res) => {
  const schema = z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    price: z.number().positive(),
    oldPrice: z.number().positive().optional(),
    categoryId: z.number().int().positive(),
    stock: z.number().int().nonnegative(),
    image: z
      .string()
      .optional()
      .transform((v) => (v && v.trim() ? v.trim() : undefined))
      .pipe(z.union([z.string().url(), z.undefined()])),
    gallery: z.array(z.string().url()).optional(),
    brand: z.string().optional(),
    isPublished: z.boolean().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: validationMessage(parsed) });
  const data = { ...parsed.data };
  if (data.image === "") delete data.image;
  const slug = await uniqueSlug(Product, parsed.data.title);
  const product = await Product.create({ ...data, slug });
  res.status(201).json(product);
});

const productSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  price: z.number().positive().optional(),
  oldPrice: z.number().positive().nullable().optional(),
  categoryId: z.number().optional(),
  stock: z.number().int().nonnegative().optional(),
  image: z.union([z.string().url(), z.literal("")]).optional(),
  brand: z.string().optional(),
  isPublished: z.boolean().optional(),
});

router.put("/products/:id", allowRoles("ADMIN", "MANAGER", "CONTENT_MANAGER"), async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Ошибка валидации" });
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ message: "Товар не найден" });
  const data = { ...parsed.data };
  if (data.title) data.slug = await uniqueSlug(Product, data.title, product.id);
  if (Object.prototype.hasOwnProperty.call(data, "image")) {
    data.image = data.image && data.image.trim() ? data.image.trim() : null;
  }
  const previousImage = product.image;
  await product.update(data);
  if (Object.prototype.hasOwnProperty.call(data, "image") && data.image !== previousImage) {
    await deleteLocalUpload(previousImage);
  }
  res.json(product);
});

router.delete("/products/:id", allowRoles("ADMIN"), async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ message: "Товар не найден" });
  const imageToDelete = product.image;
  await sequelize.transaction(async (transaction) => {
    await Favorite.destroy({ where: { productId: product.id }, transaction });
    await Review.destroy({ where: { productId: product.id }, transaction });
    await product.destroy({ transaction });
  });
  await deleteLocalUpload(imageToDelete);
  res.status(204).send();
});

router.get("/orders", async (req, res) => {
  const status = req.query.status || "";
  const where = status ? { status } : {};
  const orders = await Order.findAll({
    where,
    include: [{ model: User, attributes: ["name", "email"] }, { model: OrderItem, include: [Product] }],
    order: [["createdAt", "DESC"]],
  });
  res.json(orders);
});

router.patch("/orders/:id/status", allowRoles("ADMIN", "MANAGER"), async (req, res) => {
  const schema = z.object({
    status: z.enum(["NEW", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Ошибка валидации" });
  const order = await Order.findByPk(req.params.id);
  if (!order) return res.status(404).json({ message: "Заказ не найден" });

  const prevStatus = order.status;
  const nextStatus = parsed.data.status;

  await sequelize.transaction(async (t) => {
    if (nextStatus === "CANCELLED" && prevStatus !== "CANCELLED") {
      await restoreOrderStock(order.id, t);
    }
    order.status = nextStatus;
    if (nextStatus === "PAID") order.isPaid = true;
    if (nextStatus === "CANCELLED") order.isPaid = false;
    await order.save({ transaction: t });
  });

  res.json(order);
});

router.get("/users", async (_req, res) => {
  const users = await User.findAll({ attributes: ["id", "name", "email", "role", "isBlocked", "createdAt"] });
  res.json(users);
});

router.patch("/users/:id", allowRoles("ADMIN"), async (req, res) => {
  const schema = z.object({
    role: z.enum(["ADMIN", "MANAGER", "CONTENT_MANAGER", "CUSTOMER"]).optional(),
    isBlocked: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Ошибка валидации" });
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: "Пользователь не найден" });
  await user.update(parsed.data);
  res.json({ id: user.id, role: user.role, isBlocked: user.isBlocked });
});

router.get("/reviews", async (_req, res) => {
  const reviews = await Review.findAll({ include: [User, Product], order: [["createdAt", "DESC"]] });
  res.json(reviews);
});

router.patch("/reviews/:id", allowRoles("ADMIN", "CONTENT_MANAGER"), async (req, res) => {
  const schema = z.object({ isPublished: z.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Ошибка валидации" });
  const review = await Review.findByPk(req.params.id);
  if (!review) return res.status(404).json({ message: "Отзыв не найден" });
  review.isPublished = parsed.data.isPublished;
  await review.save();
  res.json(review);
});

router.get("/categories", async (_req, res) => {
  const categories = await Category.findAll({ order: [["name", "ASC"]] });
  res.json(categories);
});

router.post("/categories", allowRoles("ADMIN", "CONTENT_MANAGER"), async (req, res) => {
  const schema = z.object({ name: z.string().min(2), parentId: z.number().nullable().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Ошибка валидации" });
  const slug = await uniqueSlug(Category, parsed.data.name);
  const category = await Category.create({
    name: parsed.data.name,
    slug,
    parentId: parsed.data.parentId || null,
  });
  res.status(201).json(category);
});

router.put("/categories/:id", allowRoles("ADMIN", "CONTENT_MANAGER"), async (req, res) => {
  const schema = z.object({ name: z.string().min(2), parentId: z.number().nullable().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Ошибка валидации" });
  const category = await Category.findByPk(req.params.id);
  if (!category) return res.status(404).json({ message: "Категория не найдена" });
  const slug = await uniqueSlug(Category, parsed.data.name, category.id);
  await category.update({
    name: parsed.data.name,
    slug,
    parentId: parsed.data.parentId ?? category.parentId,
  });
  res.json(category);
});

router.delete("/categories/:id", allowRoles("ADMIN"), async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) return res.status(404).json({ message: "Категория не найдена" });
  const linked = await Product.count({ where: { categoryId: category.id } });
  if (linked > 0) return res.status(400).json({ message: "В категории есть товары" });
  await category.destroy();
  res.status(204).send();
});

router.get("/contacts", allowRoles("ADMIN", "MANAGER"), async (_req, res) => {
  const messages = await ContactMessage.findAll({ order: [["createdAt", "DESC"]] });
  res.json(messages);
});

router.patch("/contacts/:id/read", allowRoles("ADMIN", "MANAGER"), async (req, res) => {
  const msg = await ContactMessage.findByPk(req.params.id);
  if (!msg) return res.status(404).json({ message: "Сообщение не найдено" });
  msg.isRead = true;
  await msg.save();
  res.json(msg);
});

module.exports = router;
