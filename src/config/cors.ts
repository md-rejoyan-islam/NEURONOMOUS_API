import { CorsOptions } from "cors";
import secret from "../app/secret";

const whitelist: string[] = secret.clinetWhiteList;

const corsOptions: CorsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    if ((origin && whitelist.includes(origin)) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  optionsSuccessStatus: 200,
  credentials: true,
};

export default corsOptions;
