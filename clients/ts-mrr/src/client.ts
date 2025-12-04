import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { MRR_PROGRAM_ID } from "./constants";
import { getMrrPda } from "./pdas";
import { InitializeMrrParams, MrrAccount, UpdateMrrParams } from "./types";

// Import the IDL from the root idl folder.
import idl from "../../../idl/mrr_solana.json";

export const MRR_IDL = idl as anchor.Idl;

/**
 * High-level client for the MRR program.
 */
export class MrrClient {
  readonly provider: anchor.AnchorProvider;
  readonly program: anchor.Program;

  constructor(provider: anchor.AnchorProvider) {
    this.provider = provider;

    // Cast to any to avoid TS signature mismatch across Anchor versions
    this.program = new (anchor.Program as any)(
      MRR_IDL,
      MRR_PROGRAM_ID,
      provider
    ) as any;
  }

  /**
   * Derive the MRR PDA for a given owner.
   * If `owner` is not provided, use the provider wallet.
   */
  getPda(owner?: PublicKey): [PublicKey, number] {
    const o = owner ?? this.provider.wallet.publicKey;
    return getMrrPda(o);
  }

  /**
   * Initialize a new MRR for the provider wallet.
   */
  async initialize(params: InitializeMrrParams): Promise<string> {
    const owner = this.provider.wallet.publicKey;
    const [pda] = this.getPda(owner);

    const relayUrl = params.relayUrl;
    const inboxKey = params.inboxKey;
    const handle = params.handle ?? "";
    const flags = params.flags ?? 0;

    const sig = await this.program.methods
      .initializeMrr(relayUrl, inboxKey, handle, flags)
      .accounts({
        owner,
        mrr: pda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return sig;
  }

  /**
   * Update an existing MRR for the provider wallet.
   */
  async update(params: UpdateMrrParams): Promise<string> {
    const owner = this.provider.wallet.publicKey;
    const [pda] = this.getPda(owner);

    const toOpt = <T>(v: T | undefined | null) =>
      v === undefined ? null : v;

    const relayUrlOpt = toOpt(params.relayUrl ?? null);
    const inboxKeyOpt = toOpt(params.inboxKey ?? null);
    const prevInboxKeyOpt = toOpt(params.prevInboxKey ?? null);
    const handleOpt = toOpt(params.handle ?? null);
    const flagsOpt = toOpt(params.flags ?? null);

    const sig = await this.program.methods
      .updateMrr(
        relayUrlOpt,
        inboxKeyOpt,
        prevInboxKeyOpt,
        handleOpt,
        flagsOpt
      )
      .accounts({
        owner,
        mrr: pda,
      })
      .rpc();

    return sig;
  }

  /**
   * Close the MRR PDA and reclaim rent, for the provider wallet.
   */
  async close(): Promise<string> {
    const owner = this.provider.wallet.publicKey;
    const [pda] = this.getPda(owner);

    const sig = await this.program.methods
      .closeMrr()
      .accounts({
        owner,
        mrr: pda,
      })
      .rpc();

    return sig;
  }

  /**
   * Fetch the MRR account for the given owner.
   */
  async fetch(owner: PublicKey): Promise<MrrAccount | null> {
    const [pda] = this.getPda(owner);

    try {
      // Cast account namespace to any to avoid TS complaining about field names
      const acc = await (this.program.account as any).mrr.fetch(pda);

      const typed: MrrAccount = {
        owner: acc.owner as PublicKey,
        relayUrl: acc.relayUrl as string,
        inboxKey: acc.inboxKey as PublicKey,
        prevInboxKey: acc.prevInboxKey as PublicKey,
        handle: acc.handle as string,
        flags: Number(acc.flags),
        bump: Number(acc.bump),
      };

      return typed;
    } catch (e: any) {
      if (e?.message?.includes("Account does not exist")) {
        return null;
      }
      throw e;
    }
  }
}
