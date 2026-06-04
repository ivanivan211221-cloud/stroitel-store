module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "Review",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      rating: { type: DataTypes.INTEGER, allowNull: false },
      text: { type: DataTypes.TEXT, allowNull: false },
      isPublished: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    { timestamps: true }
  );
