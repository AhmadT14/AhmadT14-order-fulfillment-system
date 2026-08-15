import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export default function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Missing or invalid access token" });
    }
    const token = authorization.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    (req as any).user = decoded;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Invalid token" });
  }
}
