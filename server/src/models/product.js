module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "Product",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      title: { type: DataTypes.STRING, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: false, unique: true },
      description: { type: DataTypes.TEXT, allowNull: false },
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      oldPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      stock: { type: DataTypes.INTEGER, defaultValue: 0 },
      brand: { type: DataTypes.STRING, allowNull: true },
      image: { type: DataTypes.STRING, allowNull: true },
      gallery: { type: DataTypes.JSON, defaultValue: [] },
      seoTitle: { type: DataTypes.STRING, allowNull: true },
      seoDescription: { type: DataTypes.STRING, allowNull: true },
      isPublished: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    { timestamps: true }
  );
