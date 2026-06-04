module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "OrderItem",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      qty: { type: DataTypes.INTEGER, allowNull: false },
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    },
    { timestamps: false }
  );
