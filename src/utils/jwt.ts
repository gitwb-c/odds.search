import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SECRET_KEY;

export const signJwt = (payload: { token: string }) => {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: "7d" });
};

export const verifyJwt = (token: string): { token: string } | null => {
  try {
    return jwt.verify(token, JWT_SECRET!) as { token: string };
  } catch {
    return null;
  }
};
