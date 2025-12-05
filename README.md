# **MRR — Message Routing Record (Solana)**

### *A minimal on-chain primitive for wallet-linked messaging profiles*

**Program:** `mrr_solana`

**Program ID:** `61cVB9Sj5dWWGk5fUfPCCvwpRtpMds2QW4Q5G7UqaDYV`

**Network:** Devnet (experimental / unaudited)

---

# 🔹 Overview

**MRR (Message Routing Record)** is a tiny, universal Solana primitive that lets a wallet publish a **messaging routing profile** — a canonical on-chain record telling others:

* **Which encryption key** they should use to message you
* **Where to send ciphertext** (relay URIs)
* **Optional handle**
* **Optional capability flags**

MRR does **not** store messages.
It provides the *directory entry* needed for any encrypted messaging system to work across wallets and apps.

---

# 🔹 Goals

### ✔ Minimal

A single PDA per wallet with only the fields required for message routing.

### ✔ Interoperable

Works with any encrypted messaging scheme, relay design, or wallet UX.

### ✔ Unopinionated

MRR defines *only* how to discover a user’s messaging endpoints — nothing else.

### ✔ Update-Friendly

Supports key rotation, relay migration, and handle updates.

### ✔ Wallet-Native

Accounts are deterministic PDAs derived from:

```
["mrr", owner_pubkey]
```

---

# 🔹 Non-Goals

MRR intentionally **does not**:

* Store messages/ciphertext
* Provide inboxes, conversations, or UI
* Define encryption/message formats
* Offer spam protection
* Replace off-chain relay infrastructure

Those concerns are delegated to wallet developers and relay operators.

---

# 🔹 Account Structure

```rust
pub struct Mrr {
    pub owner: Pubkey,               // Wallet controlling this routing profile
    pub enc_pubkey: [u8; 32],        // Encryption key (x25519, ed25519-converted, etc.)
    pub primary_relay_uri: String,   // Main relay endpoint
    pub backup_relay_uri: String,    // Optional secondary relay
    pub handle: String,              // Optional human-readable handle
    pub capabilities: u32,           // Bitfield for feature flags
    pub bump: u8,                    // PDA bump
}
```

### PDA Derivation

```
PDA = Pubkey::find_program_address(["mrr", owner], program_id)
```

---

# 🔹 Instructions

### **1. init_mrr**

Create a new MRR for the wallet.

Inputs:

* `enc_pubkey` (32 bytes)
* `primary_relay_uri`
* `backup_relay_uri`
* `handle`
* `capabilities`

Fails if the PDA already exists.

---

### **2. update_mrr**

Modify the routing profile.

Used for:

* key rotation
* relay swaps
* handle changes
* capability bitfield updates

---

### **3. close_mrr**

Delete the record and reclaim rent.

---

# 🔹 How It Works (Diagrammatic Flow)

### **Wallet Sets Up MRR**

1. Wallet generates an encryption/inbox keypair off-chain.
2. Wallet calls `init_mrr` with key + relay info.
3. A deterministic PDA is created containing the routing record.

---

### **Sender Wants to Message Someone**

1. Sender derives PDA for target wallet.
2. Fetches MRR → gets encryption key & relay URI.
3. Encrypts message off-chain.
4. Posts ciphertext to the relay.

---

### **Receiver Gets Message**

1. Relay delivers ciphertext (HTTP/WebSocket/etc).
2. Receiver decrypts locally.
3. Messages stay completely off-chain.

MRR only stores *how* to reach the user — not any messages.

---

# 🔹 Status

* ✔ **Working Devnet program**
* ✔ **Working TypeScript SDK** (example included)
* ⚠ **Not audited — experimental**
* Intended for wallet developers, relay developers, and messaging protocol researchers.

---

# 🔹 Repository Layout

```
/programs/mrr_program      → Anchor on-chain program
/idl/mrr_solana.json        → IDL for clients
/clients/ts-mrr             → TypeScript SDK + example
```

---

# 🔹 Example (TS SDK)

Initialize:

```ts
const client = new MrrClient(connection, wallet);

await client.initialize({
  encPubkey: inboxKey.toBytes(),
  primaryRelayUri: "https://relay.example.com",
  backupRelayUri: "",
  handle: "rekt-devnet",
  capabilities: 0,
});
```

Fetch:

```ts
const record = await client.fetch(wallet.publicKey);
console.log(record);
```

---

