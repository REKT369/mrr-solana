# MRR — Message Routing Record (Solana)

**Program ID (Devnet):** `61cVB9Sj5dWWGk5fUfPCCvwpRtpMds2QW4Q5G7UqaDYV`
**Status:** Live on Devnet · Stable IDL · TypeScript SDK included

MRR (**Message Routing Record**) is a minimal, universal, on-chain primitive that gives any Solana wallet a **public messaging profile**:

> *“If you want to send me encrypted messages, use this key and deliver to this relay.”*

MRR defines **zero opinions** about inboxes, messaging protocols, clients, or encryption schemes.
Instead, it provides a clean, verifiable PDA that all wallets, relays, clients, and dApps can rely on as a **canonical routing record**.

---

## Why MRR Exists

Every messaging system invents their own “how do I DM this wallet?” field.
MRR fixes that by giving the ecosystem a **single, interoperable record**:

* 1 PDA per wallet (`["mrr", owner_pubkey]`)
* Encryption/Inbox public key (for off-chain ciphertext delivery)
* Primary + backup relay URIs
* Optional handle (e.g., `rekt.sol`)
* Capability flags for future extension

This makes MRR suitable for:

* Wallet-to-wallet encrypted messaging
* Relay-based messaging networks
* Wallet-linked email/DM bridges
* Cross-application messaging interoperability
* QR-code “message me” systems

MRR does **not** store ciphertext, messages, threads, or metadata on-chain.
Everything beyond routing is left to off-chain rails and protocol layers.

---

## What’s in This Repository

This repo contains everything needed to integrate MRR:

### **1. Solana Program (Anchor)**

* Fully implemented Rust program (`programs/mrr_program`)
* Deterministic PDA derivation
* Instructions:

  * `init_mrr`
  * `update_mrr`
  * `close_mrr`
* Supports key rotation, relay updates, capability flags, and handle updates

### **2. Generated IDL**

Located at:

```
idl/mrr_solana.json
```

### **3. TypeScript SDK**

Located in:

```
clients/ts-mrr/
```

Features:

* PDA helpers
* High-level client methods (`initialize`, `update`, `close`, `fetch`)
* Clean wrapper around the Anchor program
* Example script (`example-init.ts`) demonstrating end-to-end usage

---

## Quick Start (SDK Example)

```ts
import * as anchor from "@coral-xyz/anchor";
import { MrrClient, MRR_PROGRAM_ID } from "./dist";
import { Keypair } from "@solana/web3.js";

(async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const client = new MrrClient(provider);
  const inbox = Keypair.generate().publicKey;

  const tx = await client.initialize({
    encPubkey: inbox,
    primaryRelayUri: "https://relay.example.com",
    backupRelayUri: "",
    handle: "mrr-devnet-demo",
    capabilities: 0
  });

  console.log("Initialized MRR:", tx);

  const owner = provider.wallet.publicKey;
  const record = await client.fetch(owner);
  console.log("MRR record:", record);
})();
```

---

## Philosophy

MRR is intentionally “small”:

* No inbox
* No messages
* No spam prevention
* No protocol-level encryption definitions
* No storage of ciphertext

Just the minimum viable routing surface so the ecosystem can converge on a unified **wallet messaging identity layer**.

