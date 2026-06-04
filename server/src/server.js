const { app, connectDb } = require("./app");

const PORT = process.env.PORT || 4000;

async function maybeSeed() {
  if (process.env.SEED_IF_EMPTY === "false") return;
  const { Product } = require("./models");
  const count = await Product.count();
  if (count > 0) return;
  const { seed } = require("./seed/seed");
  console.log("База пустая — заполняем демо-данными...");
  await seed({ sync: false });
  console.log("Seed complete");
}

async function maybeRepairCatalog() {
  const { Op } = require("sequelize");
  const { Category, Product } = require("./models");
  const { isBrokenSlug } = require("./utils/helpers");
  const cats = await Category.findAll({ attributes: ["slug"] });
  const catCount = cats.length;
  const badProducts = await Product.count({ where: { slug: { [Op.like]: "-%" } } });
  if (catCount >= 8 && badProducts === 0 && !cats.some((c) => isBrokenSlug(c.slug))) return;
  const { repairCatalog } = require("./seed/seed");
  console.log("Восстановление категорий и slug каталога...");
  await repairCatalog();
}

connectDb()
  .then(() => maybeSeed())
  .then(() => maybeRepairCatalog())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API running on http://localhost:${PORT}`);
    });
  })
  .catch((e) => {
    console.error("DB connection failed", e);
    process.exit(1);
  });
