const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = require("./user")(sequelize, DataTypes);
const Category = require("./category")(sequelize, DataTypes);
const Product = require("./product")(sequelize, DataTypes);
const Review = require("./review")(sequelize, DataTypes);
const Order = require("./order")(sequelize, DataTypes);
const OrderItem = require("./orderItem")(sequelize, DataTypes);
const ContactMessage = require("./contactMessage")(sequelize, DataTypes);
const Favorite = require("./favorite")(sequelize, DataTypes);

Category.hasMany(Product, { foreignKey: "categoryId" });
Product.belongsTo(Category, { foreignKey: "categoryId" });

Category.hasMany(Category, { as: "children", foreignKey: "parentId" });
Category.belongsTo(Category, { as: "parent", foreignKey: "parentId" });

User.hasMany(Review, { foreignKey: "userId" });
Review.belongsTo(User, { foreignKey: "userId" });

Product.hasMany(Review, { foreignKey: "productId" });
Review.belongsTo(Product, { foreignKey: "productId" });

User.hasMany(Order, { foreignKey: "userId" });
Order.belongsTo(User, { foreignKey: "userId" });

Order.belongsToMany(Product, { through: OrderItem, foreignKey: "orderId" });
Product.belongsToMany(Order, { through: OrderItem, foreignKey: "productId" });

Order.hasMany(OrderItem, { foreignKey: "orderId" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });
Product.hasMany(OrderItem, { foreignKey: "productId" });
OrderItem.belongsTo(Product, { foreignKey: "productId" });

User.hasMany(Favorite, { foreignKey: "userId" });
Favorite.belongsTo(User, { foreignKey: "userId" });
Product.hasMany(Favorite, { foreignKey: "productId" });
Favorite.belongsTo(Product, { foreignKey: "productId" });

User.belongsToMany(Product, { through: Favorite, foreignKey: "userId", otherKey: "productId" });
Product.belongsToMany(User, { through: Favorite, foreignKey: "productId", otherKey: "userId" });

module.exports = {
  sequelize,
  User,
  Category,
  Product,
  Review,
  Order,
  OrderItem,
  ContactMessage,
  Favorite,
};
