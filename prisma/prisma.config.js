const { defineConfig } = require("@prisma/config");

module.exports = defineConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  seed: "npx tsx prisma/seed.ts",
});