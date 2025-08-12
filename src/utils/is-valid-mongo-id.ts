import { Types } from "mongoose";

export const isValidMongoId = (id: string): boolean => {
  return Types.ObjectId.isValid(id);
};
