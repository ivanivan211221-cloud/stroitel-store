require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
const { sequelize } = require("./models");

const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const orderRoutes = require("./routes/order.routes");
const reviewRoutes = require("./routes/review.routes");
const adminRoutes = require("./routes/admin.routes");
const categoryRoutes = require("./routes/category.routes");
const contactRoutes = require("./routes/contact.routes");
const favoriteRoutes = require("./routes/favorite.routes");
const siteRoutes = require("./routes/site.routes");
const uploadRoutes = require("./routes/upload.routes");

const app = express();

const uploadsPath = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
const clientDistPath = path.resolve(process.cwd(), "..", "client", "dist");
const serveClient = process.env.NODE_ENV === "production" && fs.existsSync(clientDistPath);

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}
const cspDirectives = helmet.contentSecurityPolicy.getDefaultDirectives();
delete cspDirectives["img-src"];

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...cspDirectives,
        imgSrc: [
          "'self'",
          "data:",
          "https://images.unsplash.com",
          "https://source.unsplash.com",
          "https://loremflickr.com",
        ],
      },
    },
  })
);
const corsOrigins = process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()).filter(Boolean);
app.use(
  cors({
    origin: corsOrigins?.length ? corsOrigins : serveClient ? true : ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use("/uploads", express.static(uploadsPath));

app.get("/api/health", async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ ok: true, db: true });
  } catch {
    res.status(503).json({ ok: false, db: false });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/site", siteRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);

if (serveClient) {
  app.use(express.static(clientDistPath));
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Внутренняя ошибка сервера" });
});

const connectDb = async () => {
  await sequelize.authenticate();
  await sequelize.sync();
};

module.exports = { app, connectDb };
