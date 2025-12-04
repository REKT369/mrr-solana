import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import type { InitializeMrrParams, MrrAccount, UpdateMrrParams } from "./types";
export declare class MrrClient {
    readonly provider: anchor.AnchorProvider;
    readonly program: anchor.Program;
    constructor(provider: anchor.Provider);
    /**
     * Derive PDA for an owner's MRR record.
     */
    getPda(owner: PublicKey): [PublicKey, number];
    /**
     * Initialize a new Message Routing Record for the provider wallet.
     */
    initialize(params: InitializeMrrParams): Promise<string>;
    /**
     * Update an existing MRR.
     */
    update(params: UpdateMrrParams): Promise<string>;
    /**
     * Close the caller's MRR and reclaim rent.
     */
    close(ownerOverride?: PublicKey): Promise<string>;
    /**
     * Fetch the MRR account for a given owner.
     * Returns null if no account exists.
     */
    fetch(owner: PublicKey): Promise<MrrAccount | null>;
}
