/**
 * Wallet Service
 * Manages viem-based local wallets stored in memory
 * Each user gets an isolated wallet instance
 */

import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { Account } from "viem";
import type { SignerConfig } from "@burnt-labs/abstraxion-core";
import { AUTHENTICATOR_TYPE } from "@burnt-labs/signers";

interface WalletData {
  privateKey: `0x${string}`;
  account: Account;
}

/**
 * Wallet Service for managing in-memory viem wallets
 */
export class WalletService {
  private wallets: Map<string, WalletData> = new Map();

  /**
   * Create a new wallet for a user
   * @param userId - Unique user identifier
   * @returns The created wallet's Ethereum address
   */
  async createWallet(userId: string): Promise<string> {
    if (this.wallets.has(userId)) {
      const existingWallet = this.wallets.get(userId)!;
      return existingWallet.account.address;
    }

    // Generate a new private key
    const privateKey = generatePrivateKey();

    // Create account from private key
    const account = privateKeyToAccount(privateKey);

    // Store wallet data
    this.wallets.set(userId, {
      privateKey,
      account,
    });

    return account.address;
  }

  /**
   * Get wallet for a user
   * @param userId - Unique user identifier
   * @returns Wallet data or null if not found
   */
  getWallet(userId: string): WalletData | null {
    return this.wallets.get(userId) || null;
  }

  /**
   * Get SignerConfig for Abstraxion
   * @param userId - Unique user identifier
   * @returns SignerConfig for the user's wallet
   * @throws Error if wallet doesn't exist
   */
  async getSignerConfig(userId: string): Promise<SignerConfig> {
    const wallet = this.getWallet(userId);
    if (!wallet) {
      throw new Error(
        `Wallet not found for user: ${userId}. Call createWallet() first.`,
      );
    }

    const { account } = wallet;

    return {
      authenticatorType: AUTHENTICATOR_TYPE.EthWallet,
      authenticator: account.address.toLowerCase(),
      signMessage: async (hexMessage: string) => {
        if (!hexMessage.startsWith("0x")) {
          throw new Error(
            `Invalid message format: expected hex string with 0x prefix, got: ${hexMessage.substring(0, 50)}...`,
          );
        }

        if (!account.signMessage) {
          throw new Error("Account does not have a signMessage method");
        }

        // Sign message using viem account
        // Note: viem's signMessage handles personal_sign formatting automatically
        const signature = await account.signMessage({
          message: {
            raw: hexMessage as `0x${string}`,
          },
        });

        return signature;
      },
    };
  }

  /**
   * Delete wallet for a user
   * @param userId - Unique user identifier
   */
  deleteWallet(userId: string): void {
    this.wallets.delete(userId);
  }

  /**
   * Get all user IDs with wallets
   * @returns Array of user IDs
   */
  getAllUserIds(): string[] {
    return Array.from(this.wallets.keys());
  }

  /**
   * Clear all wallets (use with caution!)
   */
  clearAll(): void {
    this.wallets.clear();
  }

  /**
   * Get wallet count
   */
  getWalletCount(): number {
    return this.wallets.size;
  }
}
