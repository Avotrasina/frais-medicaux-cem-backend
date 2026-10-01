import { defineConfig } from "prisma/config";
import { env } from "./src/settings/env.validator.js";

export default defineConfig({
  schema: "prisma/",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env.DATABASE_URL,
  },
});
