/**
 * Backend Signer App - Main Entry Point
 * Demonstrates how to use Abstraxion SignerMode in a backend environment
 */

import { WalletService } from "./services/WalletService";
import { AbstraxionService } from "./services/AbstraxionService";
import { MemoryStorageStrategy } from "./storage/MemoryStorageStrategy";
import { NoOpRedirectStrategy } from "./strategies/NoOpRedirectStrategy";
import { defaultConfig, validateConfig } from "./config/defaultConfig";

async function main() {
  console.log("🚀 Starting Backend Signer App...\n");

  // Validate configuration
  try {
    validateConfig(defaultConfig);
  } catch (error) {
    console.error("❌ Configuration error:", error);
    console.error(
      "\nPlease set the following environment variables:",
    );
    console.error("  - FEE_GRANTER_ADDRESS: Fee granter address");
    process.exit(1);
  }

  // User ID for this demo (in production, this would come from your auth system)
  const userId = "demo-user-123";

  // 1. Create wallet service and wallet
  console.log("📦 Creating wallet service...");
  const walletService = new WalletService();
  const walletAddress = await walletService.createWallet(userId);
  console.log(`✅ Created wallet: ${walletAddress}\n`);

  // 2. Create storage and redirect strategies
  console.log("💾 Setting up storage strategies...");
  const storageStrategy = new MemoryStorageStrategy();
  const redirectStrategy = new NoOpRedirectStrategy();
  console.log("✅ Storage strategies ready\n");

  // 3. Create Abstraxion service
  console.log("🔧 Creating Abstraxion service...");
  const abstraxionService = new AbstraxionService(
    {
      chainId: defaultConfig.chainId,
      rpcUrl: defaultConfig.rpcUrl,
      restUrl: defaultConfig.restUrl,
      gasPrice: defaultConfig.gasPrice,
      aaApiUrl: defaultConfig.aaApiUrl,
      smartAccountContract: defaultConfig.smartAccountContract,
      getSignerConfig: () => walletService.getSignerConfig(userId),
      feeGranter: defaultConfig.feeGranter,
      treasury: defaultConfig.treasury,
      // Optional: Add grant configurations
      // bank: [{ denom: "uxion", amount: "1000000" }],
      // contracts: ["xion1..."],
      // stake: true,
    },
    storageStrategy,
    redirectStrategy,
  );
  console.log("✅ Abstraxion service created\n");

  try {
    // 4. Initialize service (attempts to restore session)
    console.log("🔄 Initializing service...");
    await abstraxionService.initialize();
    console.log("✅ Service initialized\n");

    // 5. Check connection status
    const isConnected = abstraxionService.isConnected();
    console.log(`📊 Connection status: ${isConnected ? "Connected" : "Not connected"}\n`);

    if (!isConnected) {
      // 6. Connect (creates account and grants automatically)
      console.log("🔗 Connecting to Abstraxion...");
      console.log("   This will:");
      console.log("   - Discover or create smart account");
      console.log("   - Create session keypair");
      console.log("   - Create grants (if configured)");
      console.log("   - Set up signing client\n");

      await abstraxionService.connect();
      console.log("✅ Connected successfully!\n");
    }

    // 7. Get account information
    const granterAddress = abstraxionService.getGranterAddress();
    const granteeAddress = abstraxionService.getGranteeAddress();
    console.log("📋 Account Information:");
    console.log(`   Smart Account (Granter): ${granterAddress}`);
    console.log(`   Session Key (Grantee): ${granteeAddress}`);
    console.log(`   Wallet Address: ${walletAddress}\n`);

    // 8. Get signing client (ready to use for transactions)
    const signingClient = abstraxionService.getSigningClient();
    console.log("✅ Signing client ready for transactions\n");

    // Example: You can now use signingClient to send transactions
    // const result = await signingClient.sendTokens(...);

    console.log("✨ Demo completed successfully!");
    console.log("\n💡 Next steps:");
    console.log("   - Use signingClient to send transactions");
    console.log("   - Grants are automatically managed");
    console.log("   - Session persists until disconnect() is called");

  } catch (error) {
    console.error("\n❌ Error occurred:");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      if (error.stack) {
        console.error("\nStack trace:");
        console.error(error.stack);
      }
    } else {
      console.error(error);
    }

    // Check for error state
    const errorMessage = abstraxionService.getError();
    if (errorMessage) {
      console.error(`\n   Controller error: ${errorMessage}`);
    }
  } finally {
    // 9. Cleanup
    console.log("\n🧹 Cleaning up...");
    abstraxionService.destroy();
    walletService.deleteWallet(userId);
    console.log("✅ Cleanup complete");
  }
}

// Run the demo
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
