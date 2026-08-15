import "express";

export interface AuthPayload {
  sub: string;
  iat: number;
  exp: number;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthPayload;
  }
}
