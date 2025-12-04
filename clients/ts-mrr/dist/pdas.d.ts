import { PublicKey } from "@solana/web3.js";
/**
 * Derive the PDA for a wallet's Message Routing Record.
 *
 * Seeds: ["mrr", owner_pubkey]
 */
export declare function getMrrPda(owner: PublicKey): [PublicKey, number];
