const verifyToken = require("../utils/verifyToken");

const verifyAuth = (req, res, next) => {
  try {
    const decoded = verifyToken(req);
    req.user = decoded; 
    next();
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
};

const verifyAdmin = (req, res, next) => {
  try {
    const decoded = verifyToken(req);

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
};

module.exports = {
  verifyAuth,
  verifyAdmin,
};
