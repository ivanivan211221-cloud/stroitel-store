require("dotenv").config();
const { sequelize, User, Category, Product } = require("../models");
const { Op } = require("sequelize");
const { slugify } = require("../utils/helpers");

async function upsertCatalog() {
  const categories = [
    { name: "Сухие смеси" },
    { name: "Кирпич и блоки" },
    { name: "Крепеж" },
    { name: "Инструмент" },
    { name: "Кровля" },
    { name: "Утеплители" },
    { name: "Лакокрасочные материалы" },
    { name: "Электрика" },
  ];

  for (const c of categories) {
    const slug = slugify(c.name);
    const [category] = await Category.findOrCreate({
      where: { name: c.name },
      defaults: { name: c.name, slug },
    });
    if (category.slug !== slug) await category.update({ slug });
  }

  const all = await Category.findAll();
  const bySlug = Object.fromEntries(all.map((c) => [c.slug, c]));
  const byName = new Proxy(Object.fromEntries(all.map((c) => [c.name, c])), {
    get(target, prop) {
      const key = String(prop);
      return target[key] || bySlug[slugify(key)];
    },
  });

  const products = [
    {
      title: "Цемент М500, 50кг",
      description: "Высокопрочный цемент для фундамента и стяжки.",
      price: 520,
      oldPrice: 560,
      stock: 180,
      brand: "EuroCem",
      categoryId: byName["Сухие смеси"].id,
      image: "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?q=80&w=1400&auto=format&fit=crop",
    },
    {
      title: "Газоблок D500",
      description: "Легкий и теплый блок для несущих и внутренних стен.",
      price: 190,
      stock: 1200,
      brand: "AeroBlock",
      categoryId: byName["Кирпич и блоки"].id,
      image: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=1400&auto=format&fit=crop",
    },
    {
      title: "Шуруп универсальный 5x70",
      description: "Оцинкованный крепеж для дерева и гипсокартона.",
      price: 3.5,
      stock: 5000,
      brand: "FixPro",
      categoryId: byName["Крепеж"].id,
      image: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=1400&auto=format&fit=crop",
    },
    {
      title: "Перфоратор 900W",
      description: "Надежный перфоратор для профессиональных работ.",
      price: 8990,
      oldPrice: 9990,
      stock: 32,
      brand: "MakCore",
      categoryId: byName["Инструмент"].id,
      image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=1400&auto=format&fit=crop",
    },
    {
      title: "Клей плиточный C2, 25кг",
      description: "Эластичный клей для керамической плитки и керамогранита.",
      price: 470,
      oldPrice: 530,
      stock: 240,
      brand: "FlexBond",
      categoryId: byName["Сухие смеси"].id,
      image: "https://images.unsplash.com/photo-1612781869838-41269e52ee43?q=80&w=1400&auto=format&fit=crop",
    },
    {
      title: "Шпаклевка финишная 20кг",
      description: "Для чистового выравнивания стен и потолков внутри помещений.",
      price: 390,
      stock: 310,
      brand: "WhiteLine",
      categoryId: byName["Сухие смеси"].id,
      image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=1400&auto=format&fit=crop",
    },
    {
      title: "Кирпич облицовочный красный",
      description: "Морозостойкий кирпич для фасадных и декоративных работ.",
      price: 38,
      stock: 10000,
      brand: "BrickMaster",
      categoryId: byName["Кирпич и блоки"].id,
      image: "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?q=80&w=1400&auto=format&fit=crop",
    },
    {
      title: "Блок керамический 2.1НФ",
      description: "Крупноформатный блок для теплых и прочных стен.",
      price: 160,
      oldPrice: 178,
      stock: 2600,
      brand: "PoroStone",
      categoryId: byName["Кирпич и блоки"].id,
      image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=1400&auto=format&fit=crop",
    },
    {
      title: "Анкер клиновой 10x120",
      description: "Надежное крепление тяжелых конструкций к бетону.",
      price: 28,
      stock: 1800,
      brand: "FixPro",
      categoryId: byName["Крепеж"].id,
      image: "https://images.unsplash.com/photo-1590598011983-24f4f8a2f51e?q=80&w=1400&auto=format&fit=crop",
    },
    {
      title: "Дюбель-гвоздь 6x60",
      description: "Быстрый монтаж профилей и легких конструкций.",
      price: 4.2,
      stock: 6500,
      brand: "FixPro",
      categoryId: byName["Крепеж"].id,
      image: "https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?q=80&w=1400&auto=format&fit=crop",
    },
    {
      title: "Шуруповерт аккумуляторный 18V",
      description: "Компактный инструмент для сборки и монтажа.",
      price: 7490,
      oldPrice: 8290,
      stock: 44,
      brand: "MakCore",
      categoryId: byName["Инструмент"].id,
      image: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?q=80&w=1400&auto=format&fit=crop",
    },
    {
      title: "УШМ 125мм 1100W",
      description: "Универсальная болгарка для резки и шлифования.",
      price: 5390,
      stock: 57,
      brand: "SteelDrive",
      categoryId: byName["Инструмент"].id,
      image: "https://images.unsplash.com/photo-1673355010144-469f0f1f9d89?q=80&w=1400&auto=format&fit=crop",
    },
    {
      title: "Металлочерепица Монтеррей 0.45",
      description: "Популярный кровельный профиль с полимерным покрытием.",
      price: 720,
      oldPrice: 780,
      stock: 530,
      brand: "RoofLine",
      categoryId: byName["Кровля"].id,
      image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1400&auto=format&fit=crop",
    },
    {
      title: "Профнастил С21 0.5",
      description: "Прочный лист для кровли и ограждений.",
      price: 640,
      stock: 800,
      brand: "RoofLine",
      categoryId: byName["Кровля"].id,
      image: "https://images.unsplash.com/photo-1621535957995-3f6f12e7266a?q=80&w=1400&auto=format&fit=crop",
    },
    {
      title: "Минеральная вата 50мм",
      description: "Тепло- и звукоизоляция для стен, перекрытий и фасадов.",
      price: 1850,
      oldPrice: 2100,
      stock: 220,
      brand: "ThermoWool",
      categoryId: byName["Утеплители"].id,
      image: "https://images.unsplash.com/photo-1605152276897-4f618f831968?q=80&w=1400&auto=format&fit=crop",
    },
    {
      title: "Пенополистирол XPS 50мм",
      description: "Экструзия для фундамента, пола и фасада.",
      price: 2980,
      stock: 165,
      brand: "ThermoWool",
      categoryId: byName["Утеплители"].id,
      image: "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?q=80&w=1400&auto=format&fit=crop",
    },
    {
      title: "Краска фасадная белая 14кг",
      description: "Стойкая краска для наружных работ, матовый эффект.",
      price: 3590,
      oldPrice: 3990,
      stock: 74,
      brand: "ColorPro",
      categoryId: byName["Лакокрасочные материалы"].id,
      image: "https://images.unsplash.com/photo-1604186838309-c6715f0d3d5c?q=80&w=1400&auto=format&fit=crop",
    },
    {
      title: "Грунтовка глубокого проникновения 10л",
      description: "Укрепляет основание и снижает расход краски.",
      price: 890,
      stock: 180,
      brand: "ColorPro",
      categoryId: byName["Лакокрасочные материалы"].id,
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1400&auto=format&fit=crop",
    },
    {
      title: "Кабель ВВГнг 3x2.5, 100м",
      description: "Медный кабель для скрытой и открытой проводки.",
      price: 9450,
      stock: 40,
      brand: "ElectroMax",
      categoryId: byName["Электрика"].id,
      image: "https://images.unsplash.com/photo-1555963966-b7ae5404b6ed?q=80&w=1400&auto=format&fit=crop",
    },
    {
      title: "Автоматический выключатель C16",
      description: "Модульный автомат для защиты линий 220В.",
      price: 260,
      stock: 370,
      brand: "ElectroMax",
      categoryId: byName["Электрика"].id,
      image: "https://images.unsplash.com/photo-1611273426858-4506f7f5f537?q=80&w=1400&auto=format&fit=crop",
    },
  ];

  for (const p of products) {
    const slug = slugify(p.title);
    const existing = await Product.findOne({ where: { title: p.title } });
    const payload = { ...p, slug, isPublished: true, gallery: [p.image] };
    if (!existing) {
      await Product.create(payload);
    } else {
      await existing.update(payload);
    }
  }
}

async function seed(options = {}) {
  await sequelize.authenticate();
  if (options.sync !== false) {
    await sequelize.sync(options.alter ? { alter: true } : {});
  }

  await upsertCatalog();

  await User.findOrCreate({
    where: { email: "admin@hozyan.ru" },
    defaults: {
      name: "Администратор",
      email: "admin@hozyan.ru",
      password: "Admin123!",
      role: "ADMIN",
    },
  });

  console.log("Seed complete");
}

async function repairCatalog() {
  await sequelize.authenticate();
  await upsertCatalog();

  const stale = await Category.findAll({
    where: { slug: { [Op.in]: ["", "-", "item"] } },
  });
  for (const c of stale) {
    const linked = await Product.count({ where: { categoryId: c.id } });
    if (!linked) await c.destroy();
  }

  console.log("Catalog repair complete");
}

module.exports = { seed, repairCatalog };

if (require.main === module) {
  seed({ alter: true })
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
