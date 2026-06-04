const { User } = require("../models");
const { verifyToken } = require("../utils/jwt");

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Необходима авторизация" });
    const payload = verifyToken(token);
    const user = await User.findByPk(payload.id);
    if (!user || user.isBlocked) return res.status(401).json({ message: "Доступ запрещен" });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Невалидный токен" });
  }
};

const allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Недостаточно прав" });
  }
  next();
};

module.exports = { auth, allowRoles };
