/**
 * Default configuration for backend signer app
 * Uses XION testnet by default
 */

export interface AppConfig {
  chainId: string;
  rpcUrl: string;
  restUrl: string;
  gasPrice: string;
  aaApiUrl: string;
  feeGranter?: string;
  treasury?: string;
  smartAccountContract: {
    codeId: number;
    checksum: string;
    addressPrefix: string;
  };
}

/**
 * Default configuration for XION testnet
 * Override these values via environment variables if needed
 */
export const defaultConfig: AppConfig = {
  chainId: process.env.CHAIN_ID || "xion-testnet-2",
  rpcUrl:
    process.env.RPC_URL ||
    "https://rpc.xion-testnet-2.burnt.com:443",
  restUrl:
    process.env.REST_URL ||
    "https://api.xion-testnet-2.burnt.com",
  gasPrice: process.env.GAS_PRICE || "0.001uxion",
  aaApiUrl:
    process.env.AA_API_URL ||
    "https://aa-api.xion-testnet-2.burnt.com",
  feeGranter: process.env.FEE_GRANTER_ADDRESS,
  treasury: process.env.TREASURY_ADDRESS,
  smartAccountContract: {
    codeId: process.env.CODE_ID
      ? parseInt(process.env.CODE_ID)
      : 1, // Default code ID, should be overridden
    checksum: process.env.CHECKSUM || "", // Must be provided
    addressPrefix: process.env.ADDRESS_PREFIX || "xion",
  },
};

/**
 * Validate that required configuration is present
 */
export function validateConfig(config: AppConfig): void {
  if (!config.smartAccountContract.checksum) {
    throw new Error(
      "CHECKSUM environment variable is required for smart account contract",
    );
  }

  if (!config.feeGranter) {
    throw new Error(
      "FEE_GRANTER_ADDRESS environment variable is required for signer mode",
    );
  }
}
