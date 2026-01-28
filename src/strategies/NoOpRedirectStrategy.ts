/**
 * No-op redirect strategy for backend usage
 * Signer mode doesn't use redirects, so all methods are no-ops
 */

import type { RedirectStrategy } from "@burnt-labs/abstraxion-core";

export class NoOpRedirectStrategy implements RedirectStrategy {
  async getCurrentUrl(): Promise<string> {
    return "http://localhost"; // Placeholder URL
  }

  async redirect(url: string): Promise<void> {
    // No-op: backend doesn't redirect
  }

  async getUrlParameter(param: string): Promise<string | null> {
    return null;
  }

  async onRedirectComplete(
    callback: (params: { granter?: string | null }) => void,
  ): Promise<void> {
    // No-op
  }

  async removeRedirectHandler(): Promise<void> {
    // No-op
  }

  async cleanUrlParameters(paramsToRemove: string[]): Promise<void> {
    // No-op
  }
}
