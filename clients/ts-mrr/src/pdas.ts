import { PublicKey } from "@solana/web3.js";
import { MRR_PROGRAM_ID } from "./constants";

/**
 * Derive the PDA for a wallet's Message Routing Record.
 *
 * Seeds: ["mrr", owner_pubkey]
 */
export function getMrrPda(owner: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("mrr"), owner.toBuffer()],
    MRR_PROGRAM_ID,
  );
}
