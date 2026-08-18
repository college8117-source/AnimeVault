import { firebaseAuth } from '../firebase.js';

export async function requireAdmin(req, res, next) {
  try {
    const authorization =
      req.headers.authorization || '';

    if (!authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required.'
      });
    }

    const token =
      authorization.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        error: 'Authentication token is missing.'
      });
    }

    const decoded =
      await firebaseAuth().verifyIdToken(token);

    if (decoded.admin !== true) {
      return res.status(403).json({
        error: 'Admin access required.'
      });
    }

    req.user = decoded;

    next();

  } catch (error) {
    console.error(
      'Admin authentication error:',
      error
    );

    return res.status(401).json({
      error:
        'Invalid or expired authentication token.'
    });
  }
}