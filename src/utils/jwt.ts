import jwt from "jsonwebtoken";
import { JwtPayload } from "../contracts/contracts";

const JWT_SECRET = process.env.SECRET_KEY;

export const signJwt = (payload: JwtPayload) => {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: "7d" });
};

export const verifyJwt = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET!) as JwtPayload;
  } catch {
    return null;
  }
};
