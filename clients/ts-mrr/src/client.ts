import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";

import idlJson from "../../../idl/mrr_solana.json";
import { MRR_PROGRAM_ID } from "./constants";
import { getMrrPda } from "./pdas";
import type { InitializeMrrParams, MrrAccount, UpdateMrrParams } from "./types";

const IDL = idlJson as anchor.Idl;

export class MrrClient {
  readonly provider: anchor.AnchorProvider;
  readonly program: anchor.Program;

  constructor(provider: anchor.Provider) {
    this.provider = provider as anchor.AnchorProvider;

    // IMPORTANT: your Anchor version uses this signature:
    // new Program(idl, provider, coder?, programId?)
    this.program = new anchor.Program(
      IDL,
      this.provider,
      undefined,
      MRR_PROGRAM_ID,
    );
  }

  /**
   * Derive PDA for an owner's MRR record.
   */
  getPda(owner: PublicKey): [PublicKey, number] {
    return getMrrPda(owner);
  }

  /**
   * Initialize a new Message Routing Record for the provider wallet.
   */
  async initialize(params: InitializeMrrParams): Promise<string> {
    const owner = this.provider.wallet.publicKey;
    const [mrrPda] = this.getPda(owner);

    const encBytes =
      params.encPubkey instanceof PublicKey
        ? params.encPubkey.toBytes()
        : params.encPubkey;

    const primaryRelayUri = params.primaryRelayUri;
    const backupRelayUri = params.backupRelayUri ?? "";
    const handle = params.handle ?? "";
    const capabilities = params.capabilities ?? 0;

    // Debug: show what instructions the IDL actually has
    const methods = (this.program as any).methods;
    console.log("Available methods in IDL:", Object.keys(methods));

    // Assumes Rust instruction is `pub fn init_mrr(...)` -> IDL name "init_mrr" -> TS method initMrr
    const sig = await methods
      .initMrr(encBytes, primaryRelayUri, backupRelayUri, handle, capabilities)
      .accounts({
        owner,
        mrr: mrrPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return sig;
  }

  /**
   * Update an existing MRR.
   */
  async update(params: UpdateMrrParams): Promise<string> {
    const owner = this.provider.wallet.publicKey;
    const [mrrPda] = this.getPda(owner);

    const newEnc =
      params.encPubkey === undefined
        ? null
        : params.encPubkey instanceof PublicKey
        ? params.encPubkey.toBytes()
        : params.encPubkey;

    const methods = (this.program as any).methods;

    const sig = await methods
      .updateMrr(
        newEnc,
        params.primaryRelayUri ?? null,
        params.backupRelayUri ?? null,
        params.handle ?? null,
        params.capabilities ?? null,
      )
      .accounts({
        owner,
        mrr: mrrPda,
      })
      .rpc();

    return sig;
  }

  /**
   * Close the caller's MRR and reclaim rent.
   */
  async close(ownerOverride?: PublicKey): Promise<string> {
    const owner = ownerOverride ?? this.provider.wallet.publicKey;
    const [mrrPda] = this.getPda(owner);

    const methods = (this.program as any).methods;

    const sig = await methods
      .closeMrr()
      .accounts({
        owner,
        mrr: mrrPda,
      })
      .rpc();

    return sig;
  }

  /**
   * Fetch the MRR account for a given owner.
   * Returns null if no account exists.
   */
  async fetch(owner: PublicKey): Promise<MrrAccount | null> {
    const [mrrPda] = this.getPda(owner);

    try {
      const acc = (await (this.program.account as any).mrr.fetch(
        mrrPda,
      )) as any;

      const result: MrrAccount = {
        owner: acc.owner as PublicKey,
        encPubkey: acc.encPubkey as Uint8Array,
        primaryRelayUri: acc.primaryRelayUri as string,
        backupRelayUri: acc.backupRelayUri as string,
        handle: acc.handle as string,
        capabilities: Number(acc.capabilities),
        bump: Number(acc.bump),
      };

      return result;
    } catch (e: any) {
      if (e?.message?.includes("Account does not exist")) {
        return null;
      }
      throw e;
    }
  }
}
