import express, { type Express, type Request, type Response } from "express";
import {
  registerusers,
  returnHashedPassword,
  returnUserId,
} from "../db/queries.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const app: Express = express();
app.use(express.json());

app.post("/register", async (req: Request, res: Response) => {
  const { name, age, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  await registerusers({ name, age, email, hashedPassword });
  res.status(201).json({ message: "User registered successfully" });
});

app.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const hashedPassword: string | undefined = await returnHashedPassword({
    email,
  });
  const userId = await returnUserId({
    email,
  });
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
      iat: Math.floor(Date.now() / 1000) - 30,
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "1h",
    },
  );
  res.json({ token });
});

app.get("/me", async (req: Request, res: Response) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid access token" });
  }

  const token = authorization.slice(7);
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    res.json({ user: decoded });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
