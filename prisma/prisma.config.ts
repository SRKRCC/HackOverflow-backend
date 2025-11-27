interface PrismaConfig {
  datasources: {
    db: {
      url: string;
    };
  };
  seed: string;
}

const config: PrismaConfig = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL ?? "",
    },
  },
  seed: "npx tsx prisma/seed.ts",
} as const;

export default config;