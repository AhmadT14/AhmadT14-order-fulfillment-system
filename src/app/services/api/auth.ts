import { Request, Response } from "express";
import { returnUserByEmail, registerusers } from "../../../db/queries.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function register(req: Request, res: Response) {
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
}

export async function login(req: Request, res: Response) {
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
}
