import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "61cVB9Sj5dWWGk5fUfPCCvwpRtpMds2QW4Q5G7UqaDYV"
);

/**
 * Derive the MRR PDA for any wallet.
 */
export async function getMrrPda(owner: PublicKey): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("mrr"), owner.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Initialize the MRR account.
 */
export async function initializeMrr(
  anchorProvider: anchor.AnchorProvider,
  relayUrl: string,
  inboxKey: PublicKey,
  handle?: string
) {
  const program = new anchor.Program(
    require("../idl/mrr_solana.json"),
    PROGRAM_ID,
    anchorProvider
  );

  const owner = anchorProvider.wallet.publicKey;
  const [pda] = await getMrrPda(owner);

  return await program.methods
    .initializeMrr(relayUrl, inboxKey, handle ?? "")
    .accounts({
      owner,
      mrr: pda,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();
}

/**
 * Update an existing MRR.
 */
export async function updateMrr(
  anchorProvider: anchor.AnchorProvider,
  fields: {
    relayUrl?: string;
    inboxKey?: PublicKey;
    prevInboxKey?: PublicKey;
    handle?: string;
    flags?: number;
  }
) {
  const program = new anchor.Program(
    require("../idl/mrr_solana.json"),
    PROGRAM_ID,
    anchorProvider
  );

  const owner = anchorProvider.wallet.publicKey;
  const [pda] = await getMrrPda(owner);

  return await program.methods
    .updateMrr(
      fields.relayUrl ?? null,
      fields.inboxKey ?? null,
      fields.prevInboxKey ?? null,
      fields.handle ?? null,
      fields.flags ?? null
    )
    .accounts({
      owner,
      mrr: pda,
    })
    .rpc();
}

/**
 * Fetches an MRR account.
 */
export async function fetchMrr(anchorProvider: anchor.AnchorProvider, owner: PublicKey) {
  const program = new anchor.Program(
    require("../idl/mrr_solana.json"),
    PROGRAM_ID,
    anchorProvider
  );

  const [pda] = await getMrrPda(owner);

  return await program.account.mrr.fetch(pda);
}
