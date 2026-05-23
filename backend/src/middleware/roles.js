export function authorizeRoles(...allowed) {
  return (req, res, next) => {
    const role = req.user?.role;
    const isAllowed = allowed.some(r => {
      if (r === 'customer' && role === 'attendee') return true;
      if (r === 'attendee' && role === 'customer') return true;
      return r === role;
    });
    if (!role || !isAllowed) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}


