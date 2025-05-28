const isAdmin = (req, res, next) => {
  if (!req.tokenData?.isAdmin) {
    return res.status(403).json({ message: 'Admins only' });
  }
  next();
};

module.exports = { isAdmin };
