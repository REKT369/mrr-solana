import type { PublicKey } from "@solana/web3.js";

export interface MrrAccount {
  owner: PublicKey;
  encPubkey: Uint8Array;
  primaryRelayUri: string;
  backupRelayUri: string;
  handle: string;
  capabilities: number;
  bump: number;
}

/**
 * Parameters for initializing a new MRR.
 */
export interface InitializeMrrParams {
  /** Encryption / inbox public key (32 bytes). */
  encPubkey: Uint8Array | PublicKey;

  /** Primary relay URI (required). */
  primaryRelayUri: string;

  /** Optional backup relay URI (fallback). */
  backupRelayUri?: string;

  /** Optional human-readable handle / username. */
  handle?: string;

  /** Optional capability bitfield. */
  capabilities?: number;
}

/**
 * Parameters for updating an existing MRR.
 * All fields are optional; only provided values will be updated on-chain.
 */
export interface UpdateMrrParams {
  encPubkey?: Uint8Array | PublicKey;
  primaryRelayUri?: string;
  backupRelayUri?: string;
  handle?: string;
  capabilities?: number;
}
