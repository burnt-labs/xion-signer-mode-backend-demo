/**
 * Abstraxion Service
 * High-level service for managing Abstraxion SignerMode connections
 * Handles SignerController lifecycle and provides simplified API
 */

import { SignerController } from "@burnt-labs/abstraxion/src/controllers";
import { AbstraxionAuth } from "@burnt-labs/abstraxion-core";
import { normalizeAbstraxionConfig } from "@burnt-labs/abstraxion/src/utils/normalizeAbstraxionConfig";
import type { AbstraxionConfig } from "@burnt-labs/abstraxion/src/types";
import type {
  StorageStrategy,
  RedirectStrategy,
  SignerConfig,
} from "@burnt-labs/abstraxion-core";
import type { GranteeSignerClient } from "@burnt-labs/abstraxion-core";

export interface AbstraxionServiceConfig {
  // Chain configuration
  chainId: string;
  rpcUrl?: string;
  restUrl?: string;
  gasPrice?: string;

  // Signer configuration
  aaApiUrl: string;
  smartAccountContract: {
    codeId: number;
    checksum: string;
    addressPrefix?: string;
  };
  getSignerConfig: () => Promise<SignerConfig>;

  // Optional configuration
  indexer?: {
    type: "numia" | "subquery";
    url: string;
    authToken?: string; // Numia
    codeId?: number; // Subquery
  };
  treasuryIndexer?: {
    url: string;
  };
  feeGranter?: string;
  treasury?: string;
  contracts?: Array<
    | string
    | { address: string; amounts: Array<{ denom: string; amount: string }> }
  >;
  bank?: Array<{ denom: string; amount: string }>;
  stake?: boolean;
}

/**
 * Abstraxion Service
 * Manages SignerController lifecycle and provides high-level API
 */
export class AbstraxionService {
  private controller: SignerController | null = null;
  private storageStrategy: StorageStrategy;
  private redirectStrategy: RedirectStrategy;
  private config: AbstraxionServiceConfig;

  constructor(
    config: AbstraxionServiceConfig,
    storageStrategy: StorageStrategy,
    redirectStrategy: RedirectStrategy,
  ) {
    this.config = config;
    this.storageStrategy = storageStrategy;
    this.redirectStrategy = redirectStrategy;
  }

  /**
   * Initialize the service (create Controller)
   * Attempts to restore existing session if available
   */
  async initialize(): Promise<void> {
    if (this.controller) {
      return; // Already initialized
    }

    // Build AbstraxionConfig
    const abstraxionConfig: AbstraxionConfig = {
      chainId: this.config.chainId,
      rpcUrl: this.config.rpcUrl,
      restUrl: this.config.restUrl,
      gasPrice: this.config.gasPrice,
      feeGranter: this.config.feeGranter,
      treasury: this.config.treasury,
      contracts: this.config.contracts,
      bank: this.config.bank,
      stake: this.config.stake,
      authentication: {
        type: "signer",
        aaApiUrl: this.config.aaApiUrl,
        getSignerConfig: this.config.getSignerConfig,
        smartAccountContract: {
          codeId: this.config.smartAccountContract.codeId,
          checksum: this.config.smartAccountContract.checksum,
          addressPrefix:
            this.config.smartAccountContract.addressPrefix || "xion",
        },
        indexer: this.config.indexer,
        treasuryIndexer: this.config.treasuryIndexer,
      },
    };

    // Normalize config
    const normalizedConfig = normalizeAbstraxionConfig(abstraxionConfig);

    // Create AbstraxionAuth (SessionManager)
    const abstraxionAuth = new AbstraxionAuth(
      this.storageStrategy,
      this.redirectStrategy,
    );

    // Configure AbstraxionAuth
    const signerAuth =
      normalizedConfig.authentication?.type === "signer"
        ? normalizedConfig.authentication
        : undefined;
    const treasuryIndexerConfig = signerAuth?.treasuryIndexer;

    abstraxionAuth.configureAbstraxionInstance(
      normalizedConfig.rpcUrl,
      normalizedConfig.contracts,
      normalizedConfig.stake,
      normalizedConfig.bank,
      undefined, // callbackUrl - not used in signer mode
      normalizedConfig.treasury,
      treasuryIndexerConfig?.url,
      normalizedConfig.gasPrice,
    );

    // Create SignerController
    this.controller = SignerController.fromConfig(
      normalizedConfig,
      this.storageStrategy,
      abstraxionAuth,
    );

    // Initialize Controller (attempts to restore session)
    await this.controller.initialize();
  }

  /**
   * Connect (create account and grants)
   * Automatically creates smart account and grants if needed
   */
  async connect(): Promise<void> {
    if (!this.controller) {
      await this.initialize();
    }

    if (!this.controller) {
      throw new Error("Failed to initialize controller");
    }

    await this.controller.connect();
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    if (this.controller) {
      await this.controller.disconnect();
      this.controller = null;
    }
  }

  /**
   * Get current state
   */
  getState() {
    if (!this.controller) {
      return { status: "idle" as const };
    }
    return this.controller.getState();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    const state = this.getState();
    return state.status === "connected";
  }

  /**
   * Get smart account address (granter)
   */
  getGranterAddress(): string {
    const state = this.getState();
    if (state.status === "connected") {
      return state.account.granterAddress;
    }
    throw new Error("Not connected. Call connect() first.");
  }

  /**
   * Get grantee address (session key address)
   */
  getGranteeAddress(): string {
    const state = this.getState();
    if (state.status === "connected") {
      return state.account.granteeAddress;
    }
    throw new Error("Not connected. Call connect() first.");
  }

  /**
   * Get signing client (for sending transactions)
   */
  getSigningClient(): GranteeSignerClient {
    const state = this.getState();
    if (state.status === "connected" && state.signingClient) {
      return state.signingClient;
    }
    throw new Error(
      "Not connected or signing client not available. Call connect() first.",
    );
  }

  /**
   * Get error message if in error state
   */
  getError(): string | null {
    const state = this.getState();
    if (state.status === "error") {
      return state.error;
    }
    return null;
  }

  /**
   * Update getSignerConfig function reference
   * Useful when external signer configuration changes
   */
  updateGetSignerConfig(getSignerConfig: () => Promise<SignerConfig>): void {
    if (this.controller) {
      this.controller.updateGetSignerConfig(getSignerConfig);
    }
    // Also update config for future reinitialization
    this.config.getSignerConfig = getSignerConfig;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.controller) {
      this.controller.destroy();
      this.controller = null;
    }
  }
}
