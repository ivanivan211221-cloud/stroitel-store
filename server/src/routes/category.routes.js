const express = require("express");
const { Category } = require("../models");

const router = express.Router();

router.get("/", async (_req, res) => {
  const categories = await Category.findAll({ order: [["name", "ASC"]] });
  res.json(categories);
});

module.exports = router;
