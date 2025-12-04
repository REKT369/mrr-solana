# MRR: Message Routing Record (Solana)

**Program:** `mrr_solana`
**Network:** Solana Devnet
**Program ID:** `61cVB9Sj5dWWGk5fUfPCCvwpRtpMds2QW4Q5G7UqaDYV`

MRR (Message Routing Record) is a minimal on-chain primitive that lets any Solana wallet publish a **messaging routing profile**:

> “If you want to send me encrypted messages, use this public key and this relay URL.”

MRR is intentionally tiny and non-opinionated:

* One PDA per wallet
* Small fixed-size fields
* No messages stored on-chain
* No inbox
* No encryption rules
* No off-chain dependencies

It acts purely as a **directory entry** for wallets, relays, and apps.

---

## 1. Goals

### 1. Minimal, universal primitive

Only the routing metadata lives on-chain so senders know how to reach you.

### 2. One record per wallet

Each wallet controls a single deterministic PDA, easy to fetch and verify.

### 3. Key rotation

Support for a current inbox key and a previous one, to make rotation smooth.

### 4. Interop-friendly

Any encrypted messaging protocol can build on top:

* Wallet-to-wallet DM
* Email-like bridges
* App-level messaging
* QR “send me a message” codes

---

## 2. Non-Goals

MRR does **not**:

* Store messages or ciphertext
* Provide inbox UI
* Solve spam or reputation
* Define encryption schemes
* Define message payload formats

All of this is left to relays, wallets, and apps.

---

## 3. Account Model

Each wallet may initialize **one** MRR account.

PDA:

* Seeds: `["mrr", owner_pubkey]`
* Program: `61cVB9Sj5dWWGk5fUfPCCvwpRtpMds2QW4Q5G7UqaDYV`

This provides a deterministic address for discovering routing information.

---

## 4. MRR Data Layout

The on-chain account is:

```
pub struct Mrr {
    pub owner: Pubkey,           // wallet controlling the PDA
    pub relay_url: String,       // off-chain relay endpoint
    pub inbox_key: Pubkey,       // encryption/public inbox key
    pub prev_inbox_key: Pubkey,  // optional old key for rotation
    pub handle: String,          // optional username / identifier
    pub flags: u8,               // capability flags
    pub bump: u8,                // PDA bump
}
```

Field notes:

* `owner` – wallet authorized to update the MRR
* `relay_url` – off-chain relay endpoint where encrypted payloads should be sent
* `inbox_key` – public key used to encrypt messages to this wallet
* `prev_inbox_key` – previous inbox key, to support key rotation grace periods
* `handle` – optional human-readable identifier (e.g. “rekt.sol”)
* `flags` – capability bitfield for future extensions
* `bump` – PDA bump used in address derivation

---

## 5. Instructions

### 5.1. `initialize_mrr`

Creates the PDA and sets initial values.

Input:

* `relay_url` (string)
* `inbox_key` (Pubkey)
* `handle` (optional string)
* `flags` (u8, optional; defaults to 0)

Behavior:

* Derives PDA from `["mrr", owner]`.
* Initializes `Mrr` with provided values.
* Sets `prev_inbox_key` to a default zero key.

### 5.2. `update_mrr`

Owner can update:

* `relay_url`
* `inbox_key` (and move current to `prev_inbox_key`)
* `handle`
* `flags`

Only the `owner` signer may call this. The PDA address does not change.

### 5.3. `close_mrr`

Closes the PDA and refunds rent to `owner`.

---

## 6. Usage Flow

### 6.1. Wallet Setup

1. Wallet generates an inbox keypair off-chain.
2. Wallet calls `initialize_mrr` with:

   * relay URL
   * inbox public key
   * optional handle

### 6.2. Sender Workflow

1. Derive PDA for the target wallet using `["mrr", owner_pubkey]`.
2. Fetch the `Mrr` account from Solana RPC.
3. Read `relay_url` and `inbox_key`.
4. Encrypt a message to `inbox_key`.
5. Send ciphertext to `relay_url` using whatever off-chain protocol the relay supports.

### 6.3. Receiver Workflow

1. Relay delivers the encrypted payload off-chain (push, poll, webhook, etc.).
2. Wallet decrypts using the private key corresponding to `inbox_key`.
3. UI displays the message in whatever UX it wants.

All message transport and storage is off-chain.
MRR only provides the routing pointer.

---

## 7. Security Model

MRR relies on:

* Solana for identity and ownership of the PDA
* Relays for private message transport
* Wallets for decryption and UI

MRR intentionally publishes the **minimum viable routing info** and nothing else.

---

## 8. Extensibility

Future capabilities can be represented via `flags`, for example:

* Multiple relay support
* Ephemeral key rotation policies
* Multi-inbox mappings
* Wallet-linked email or DM bridges
* Supported protocol versions

Because the core layout is small and stable, higher-level systems can evolve on top without breaking existing records.

---

## 9. Status

MRR v1 (Devnet) is live and deterministic under:

Program ID: `61cVB9Sj5dWWGk5fUfPCCvwpRtpMds2QW4Q5G7UqaDYV`

This document describes the v1 core behavior and layout.

---
