const { Op } = require("sequelize");
const { slugify } = require("./helpers");

async function uniqueSlug(Model, base, excludeId = null) {
  let slug = slugify(base);
  let n = 1;
  for (;;) {
    const where = { slug };
    if (excludeId != null) where.id = { [Op.ne]: excludeId };
    const row = await Model.findOne({ where });
    if (!row) return slug;
    slug = `${slugify(base)}-${n++}`;
  }
}

module.exports = { uniqueSlug };
