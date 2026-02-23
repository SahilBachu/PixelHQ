import jwt from 'jsonwebtoken';

export function authMiddleware(req: any, res: any, next: any) {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function optionalAuthMiddleware(req: any, res: any, next: any) {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      req.user = decoded;
    } catch {
      // Token invalid but optional, continue anyway
    }
  }

  next();
}
