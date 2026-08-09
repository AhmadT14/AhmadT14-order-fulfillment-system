import express, { type Express, type Request, type Response } from "express";
import {
  createOrder,
  registerusers,
  returnOrdersByUserId,
  returnOrderById,
  returnUserByEmail,
  createOrderItem,
  returnProductById,
} from "../db/queries.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import verifyToken from "./services/auth/middleware/verifyToken.js";

const app: Express = express();
app.use(express.json());

app.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, age, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const user = await returnUserByEmail({ email });
    if (user) {
      return res.status(409).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await registerusers({ name, age, email, hashedPassword });
    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
});

app.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await returnUserByEmail({ email });
    const hashedPassword: string | undefined = user?.hashed_password;
    const userId = user?.id;
    if (!hashedPassword) {
      return res.status(404).json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, hashedPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      {
        sub: userId,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "1h",
      },
    );
    return res.json({ token });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
});

app.get("/me", verifyToken, (req: Request, res: Response) => {
  return res.json({ user: (req as any).user });
});

app.post("/orders", verifyToken, async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user?.sub as string | undefined;

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Invalid order items" });
    }

    const resolvedItems: {
      productId: string;
      quantity: number;
      priceAtPurchase: string;
    }[] = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await returnProductById({ productId: item.productId });

      if (!product) {
        return res.status(400).json({
          message: `Product not found: ${item.productId}`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product: ${product.name}`,
        });
      }

      totalAmount += product.price * item.quantity;

      resolvedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: product.price.toFixed(2),
      });
    }

    const order = await createOrder({
      userId: Number(currentUserId),
      totalAmount,
    });

    for (const item of resolvedItems) {
      await createOrderItem({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
      });
    }

    return res.status(201).json({ order, items: resolvedItems });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
});

app.get("/orders/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({ message: "Invalid order id" });
    }

    const order = await returnOrderById({ orderId: id });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const currentUserId = (req as any).user?.sub as string | undefined;

    if (
      !currentUserId ||
      order.user_id === null ||
      order.user_id !== Number(currentUserId)
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.json({ order });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
});

app.get("/orders", verifyToken, async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user?.sub as string | undefined;

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const orders = await returnOrdersByUserId({
      userId: Number(currentUserId),
    });

    return res.json({ orders });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
});

if (process.env.JWT_SECRET === undefined) {
  throw new Error("JWT_SECRET is not defined in the environment variables");
}

app.listen(process.env.Port, () => {
  console.log(`Server is running on port ${process.env.Port}`);
});
