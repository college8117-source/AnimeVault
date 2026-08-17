import { firebaseAuth } from '../firebase.js';

export async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const token = authHeader.slice(7);
    const decoded = await firebaseAuth().verifyIdToken(token);

    if (decoded.admin !== true) {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}
