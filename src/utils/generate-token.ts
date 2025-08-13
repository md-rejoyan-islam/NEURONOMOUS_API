import jwt from "jsonwebtoken";
import { IJwtPayload } from "../app/types";

// Utility function to generate JWT tokens
const generateToken = (
  payload: IJwtPayload,
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
    return jwt.verify(token, secret) as IJwtPayload;
  } catch {
    throw new Error("Invalid token.");
  }
};

export default generateToken;
