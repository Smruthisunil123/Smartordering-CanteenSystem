function ensureAdmin(req, res, next) {
  if (req.user && req.user.isAdmin) {
    return next();
  }
  req.flash('error', 'Access denied. Admins only.');
  res.redirect('/');
}