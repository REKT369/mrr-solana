import { PublicKey } from "@solana/web3.js";
import { MRR_PROGRAM_ID } from "./constants";

/**
 * Derive the MRR PDA for a given wallet owner.
 */
export function getMrrPda(owner: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("mrr"), owner.toBuffer()],
    MRR_PROGRAM_ID
  );
}
