import { PublicKey } from "@solana/web3.js";

/**
 * TypeScript view of the MRR account, as returned
 * by Anchor's account fetch.
 */
export interface MrrAccount {
  owner: PublicKey;
  relayUrl: string;
  inboxKey: PublicKey;
  prevInboxKey: PublicKey;
  handle: string;
  flags: number;
  bump: number;
}

/**
 * Parameters for initializing an MRR.
 */
export interface InitializeMrrParams {
  relayUrl: string;
  inboxKey: PublicKey;
  handle?: string;
  flags?: number;
}

/**
 * Parameters for updating an MRR.
 * Only fields that are defined will be updated.
 */
export interface UpdateMrrParams {
  relayUrl?: string;
  inboxKey?: PublicKey;
  prevInboxKey?: PublicKey;
  handle?: string;
  flags?: number;
}
