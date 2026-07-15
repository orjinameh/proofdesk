import dotenv from "dotenv";

dotenv.config();

/**
 * Central environment configuration for ProofDesk.
 *
 * Design principle: ProofDesk must be able to boot and serve verification
 * requests with ZERO paid API keys configured. Any optional integration
 * that is missing simply causes the relevant agent to fall back to its
 * mock provider. Required variables are validated on boot with a helpful
 * error message instead of failing silently later.
 */

interface ProofDeskConfig {
  port: number;
  nodeEnv: "development" | "production" | "test";
  corsOrigin: string;
  mongoUri: string | undefined;
  rpcUrl: string | undefined;
  goPlusApiKey: string | undefined;
  dexApiKey: string | undefined;
  privateKey: string | undefined;
  flags: {
    mockMode: boolean;
    persistenceEnabled: boolean;
  };
}

function requireStartupSanity(): void {
  const portRaw = process.env.PORT;
  if (portRaw && Number.isNaN(Number(portRaw))) {
    // eslint-disable-next-line no-console
    console.error(
      `[ProofDesk] Invalid PORT value "${portRaw}" in environment. Falling back to 4000.`
    );
  }
}

requireStartupSanity();

const goPlusApiKey = process.env.GO_PLUS_API_KEY || undefined;
const dexApiKey = process.env.DEX_API_KEY || undefined;
const rpcUrl = process.env.RPC_URL || undefined;
const mongoUri = process.env.MONGODB_URI || undefined;

// Mock mode is automatically enabled when live provider credentials are
// absent. This is what lets ProofDesk run as a fully working hackathon
// demo without any paid infrastructure.
const mockMode = !goPlusApiKey || !dexApiKey || !rpcUrl;

export const config: ProofDeskConfig = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: (process.env.NODE_ENV as ProofDeskConfig["nodeEnv"]) || "development",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  mongoUri,
  rpcUrl,
  goPlusApiKey,
  dexApiKey,
  privateKey: process.env.PRIVATE_KEY || undefined,
  flags: {
    mockMode,
    persistenceEnabled: Boolean(mongoUri),
  },
};

export function logStartupBanner(): void {
  // eslint-disable-next-line no-console
  console.log("========================================");
  // eslint-disable-next-line no-console
  console.log(" ProofDesk - Agent Trust Verification API");
  // eslint-disable-next-line no-console
  console.log("========================================");
  // eslint-disable-next-line no-console
  console.log(`  Environment       : ${config.nodeEnv}`);
  // eslint-disable-next-line no-console
  console.log(`  Port              : ${config.port}`);
  // eslint-disable-next-line no-console
  console.log(`  Persistence (Mongo): ${config.flags.persistenceEnabled ? "ENABLED" : "disabled (in-memory only)"}`);
  // eslint-disable-next-line no-console
  console.log(`  Verification mode : ${config.flags.mockMode ? "MOCK (no live API keys detected)" : "LIVE"}`);
  if (config.flags.mockMode) {
    // eslint-disable-next-line no-console
    console.log(
      "  -> Set RPC_URL, GO_PLUS_API_KEY and DEX_API_KEY in .env to enable live checks."
    );
  }
  // eslint-disable-next-line no-console
  console.log("========================================");
}
