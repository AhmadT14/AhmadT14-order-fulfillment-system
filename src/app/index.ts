import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { registerusers, returnUserByEmail } from "../db/queries.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const app: Express = express();
app.use(express.json());

app.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, age, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await registerusers({ name, age, email, hashedPassword });
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await returnUserByEmail({ email });
    const hashedPassword: string | undefined = user?.hashedPassword;
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
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

function verifyToken(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid access token" });
  }
  const token = authorization.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
}

app.get("/me", verifyToken, (req: Request, res: Response) => {
  res.json({ user: (req as any).user });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
