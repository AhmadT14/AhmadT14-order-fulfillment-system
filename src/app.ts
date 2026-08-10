import express, { type Express, type Request, type Response } from "express";
import verifyToken from "./services/middleware/verifyToken.js";
import { login, register } from "./services/api/auth.js";
import {
  returnOrdersByUserIdHandler,
  createOrdersHandler,
  getOrderByIdHandler,
} from "./services/api/order.js";
import {
  createProductsHandler,
  returnProductsHandler,
} from "./services/api/products.js";

const app: Express = express();
app.use(express.json());

app.post("/register", register);
app.post("/login", login);
app.get("/me", verifyToken, (req: Request, res: Response) => {
  return res.json({ user: (req as any).user });
});

app.post("/orders", verifyToken, createOrdersHandler);
app.get("/orders/:id", verifyToken, getOrderByIdHandler);
app.get("/orders", verifyToken, returnOrdersByUserIdHandler);

app.post("/product", verifyToken, createProductsHandler);
app.get("/products", verifyToken, returnProductsHandler);

if (process.env.JWT_SECRET === undefined) {
  throw new Error("JWT_SECRET is not defined in the environment variables");
}

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
