function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Niezalogowany' });
  }
  next();
}

function requireManager(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Niezalogowany' });
  }
  if (req.session.user.role !== 'manager') {
    return res.status(403).json({ error: 'Brak uprawnień' });
  }
  next();
}

module.exports = { requireAuth, requireManager };
