import jwt, { JwtPayload } from "jsonwebtoken";
import { IUser } from "./types";

// Utility function to generate JWT tokens
const generateToken = <T extends object>(
  payload: T,
  config: {
    secret: string;
    expiresIn: number;
  }
) => {
  return jwt.sign(payload, config.secret, {
    expiresIn: config.expiresIn,
  });
};

// verify the token
export const verifyToken = (token: string, secret: string) => {
  try {
    return jwt.verify(token, secret) as JwtPayload as Pick<
      IUser,
      "_id" | "role"
    >;
  } catch {
    throw new Error("Invalid token");
  }
};

export default generateToken;
