function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Uporabnik ni prijavljen" });
  }

  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Uporabnik ni prijavljen" });
  }

  if (!req.session.user.vloge.includes("administrator")) {
    return res.status(403).json({ message: "Dostop je dovoljen samo administratorju" });
  }

  next();
}

module.exports = {
  requireAdmin,
  requireAuth,
};
