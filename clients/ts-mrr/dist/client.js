"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MrrClient = void 0;
const anchor = __importStar(require("@coral-xyz/anchor"));
const web3_js_1 = require("@solana/web3.js");
const mrr_solana_json_1 = __importDefault(require("../../../idl/mrr_solana.json"));
const pdas_1 = require("./pdas");
const IDL = mrr_solana_json_1.default;
class MrrClient {
    constructor(provider) {
        this.provider = provider;
        // IMPORTANT: Program gets its programId from the IDL's `address` field.
        // Signature: new Program(idl, provider, coder?, getCustomResolver?)
        this.program = new anchor.Program(IDL, this.provider);
    }
    /**
     * Derive PDA for an owner's MRR record.
     */
    getPda(owner) {
        return (0, pdas_1.getMrrPda)(owner);
    }
    /**
     * Initialize a new Message Routing Record for the provider wallet.
     */
    async initialize(params) {
        const owner = this.provider.wallet.publicKey;
        const [mrrPda] = this.getPda(owner);
        const encBytes = params.encPubkey instanceof web3_js_1.PublicKey
            ? params.encPubkey.toBytes()
            : params.encPubkey;
        const primaryRelayUri = params.primaryRelayUri;
        const backupRelayUri = params.backupRelayUri ?? "";
        const handle = params.handle ?? "";
        const capabilities = params.capabilities ?? 0;
        const methods = this.program.methods;
        console.log("Available methods in IDL:", Object.keys(methods));
        const sig = await methods
            .initMrr(encBytes, primaryRelayUri, backupRelayUri, handle, capabilities)
            .accounts({
            owner,
            mrr: mrrPda,
            systemProgram: web3_js_1.SystemProgram.programId,
        })
            .rpc();
        return sig;
    }
    /**
     * Update an existing MRR.
     */
    async update(params) {
        const owner = this.provider.wallet.publicKey;
        const [mrrPda] = this.getPda(owner);
        const newEnc = params.encPubkey === undefined
            ? null
            : params.encPubkey instanceof web3_js_1.PublicKey
                ? params.encPubkey.toBytes()
                : params.encPubkey;
        const methods = this.program.methods;
        const sig = await methods
            .updateMrr(newEnc, params.primaryRelayUri ?? null, params.backupRelayUri ?? null, params.handle ?? null, params.capabilities ?? null)
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
    async close(ownerOverride) {
        const owner = ownerOverride ?? this.provider.wallet.publicKey;
        const [mrrPda] = this.getPda(owner);
        const methods = this.program.methods;
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
    async fetch(owner) {
        const [mrrPda] = this.getPda(owner);
        try {
            const acc = (await this.program.account.mrr.fetch(mrrPda));
            const result = {
                owner: acc.owner,
                encPubkey: acc.encPubkey,
                primaryRelayUri: acc.primaryRelayUri,
                backupRelayUri: acc.backupRelayUri,
                handle: acc.handle,
                capabilities: Number(acc.capabilities),
                bump: Number(acc.bump),
            };
            return result;
        }
        catch (e) {
            if (e?.message?.includes("Account does not exist")) {
                return null;
            }
            throw e;
        }
    }
}
exports.MrrClient = MrrClient;
