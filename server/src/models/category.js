module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "Category",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false, unique: true },
      slug: { type: DataTypes.STRING, allowNull: false, unique: true },
      parentId: { type: DataTypes.INTEGER, allowNull: true },
    },
    { timestamps: true }
  );
