const { sequelize, Order, OrderItem, Product, User } = require("../models");
const { calcOrderTotals } = require("../utils/commerce");

async function createOrder({
  userId,
  customerName,
  phone,
  address,
  paymentMethod,
  items,
  promoCode,
  note,
}) {
  const user = await User.findByPk(userId);
  if (!user) throw Object.assign(new Error("Пользователь не найден"), { status: 401 });

  const productIds = items.map((i) => i.productId);
  const products = await Product.findAll({ where: { id: productIds, isPublished: true } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const totals = calcOrderTotals({
    items,
    productMap,
    promoCode,
    promoUsed: user.promoUsed,
  });

  const isCard = paymentMethod === "CARD";

  return sequelize.transaction(async (t) => {
    const order = await Order.create(
      {
        userId,
        customerName,
        phone,
        address,
        paymentMethod,
        subtotal: totals.subtotal,
        discount: totals.discount,
        deliveryFee: totals.deliveryFee,
        total: totals.total,
        promoCode: totals.promoApplied ? String(promoCode).trim().toUpperCase() : null,
        note: note || null,
        isPaid: isCard,
        status: isCard ? "PAID" : "NEW",
      },
      { transaction: t }
    );

    for (const item of items) {
      const product = productMap.get(item.productId);
      await OrderItem.create(
        {
          orderId: order.id,
          productId: item.productId,
          qty: item.qty,
          price: product.price,
        },
        { transaction: t }
      );
      product.stock -= item.qty;
      await product.save({ transaction: t });
    }

    if (totals.promoApplied) {
      user.promoUsed = true;
      await user.save({ transaction: t });
    }

    return order;
  });
}

async function restoreOrderStock(orderId, transaction) {
  const items = await OrderItem.findAll({ where: { orderId }, transaction });
  for (const item of items) {
    const product = await Product.findByPk(item.productId, { transaction });
    if (product) {
      product.stock += item.qty;
      await product.save({ transaction });
    }
  }
}

module.exports = { createOrder, restoreOrderStock };
