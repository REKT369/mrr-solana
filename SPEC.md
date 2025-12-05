# MRR: Message Routing Record (Solana)

**Program:** `mrr_solana`

**Network:** Solana Devnet

**Program ID:** `61cVB9Sj5dWWGk5fUfPCCvwpRtpMds2QW4Q5G7UqaDYV`

MRR (Message Routing Record) is a minimal on-chain primitive that lets any Solana wallet publish a **messaging routing profile**:

> “If you want to send me encrypted messages, use this public key and these relay URIs.”

MRR is intentionally small and non-opinionated:

* One PDA per wallet
* Fixed-size encryption key
* A couple of relay URIs + optional handle
* No messages or ciphertext stored on-chain

It acts purely as a **directory entry** for wallets, relays, and apps.

---

## 1. Goals

### Minimal, universal primitive

MRR provides just enough on-chain state so senders know how to reach you off-chain:

* Which public key to encrypt to
* Which relay URI(s) to post ciphertext to
* Optional human-readable handle
* A bitfield for capabilities/feature flags

### One record per wallet

Each wallet controls a single PDA, easy to fetch and verify.

### Key rotation support

Wallets can rotate their encryption key while keeping the same owner / PDA.

### Interop-friendly

Any messaging protocol can build on top:

* Wallet-to-wallet encrypted DM
* Email / DM bridges
* App-level inboxes
* “DM me” QR codes linked to your wallet

---

## 2. Non-Goals

MRR deliberately does **not**:

* Store messages or ciphertext
* Provide inbox or conversation UX
* Provide spam protection or reputation
* Define encryption schemes
* Define message formats

All of this is left to relays, wallets, and apps.

---

## 3. Account Model

Each wallet may initialize **one** MRR account:

```text
PDA seeds: ["mrr", owner_pubkey]
Program:   61cVB9Sj5dWWGk5fUfPCCvwpRtpMds2QW4Q5G7UqaDYV
```

This gives a deterministic address for:

* Fetching your routing record
* Verifying ownership
* Building any messaging layer on top

---

## 4. MRR Data Layout

Rust struct (as implemented in `programs/mrr_program/src/lib.rs`):

```rust
pub struct Mrr {
    /// Wallet that owns and can update this record.
    pub owner: Pubkey,

    /// 32-byte encryption / inbox public key (x25519, ed25519, etc).
    pub enc_pubkey: [u8; 32],

    /// Primary relay URI where ciphertext should be delivered.
    pub primary_relay_uri: String,

    /// Optional backup relay URI (may be empty string).
    pub backup_relay_uri: String,

    /// Optional human-readable handle (e.g. "rekt.sol" or "rekt_mrr").
    pub handle: String,

    /// Bitfield for capabilities / feature flags.
    pub capabilities: u32,

    /// PDA bump seed.
    pub bump: u8,
}
```

### Field notes

| Field               | Description                                           |
| ------------------- | ----------------------------------------------------- |
| `owner`             | Wallet authorized to create / update / close this MRR |
| `enc_pubkey`        | 32-byte encryption / inbox key bytes                  |
| `primary_relay_uri` | Main relay endpoint for ciphertext                    |
| `backup_relay_uri`  | Optional secondary relay (empty string if unused)     |
| `handle`            | Optional handle / username tied to this wallet        |
| `capabilities`      | `u32` bitfield for future feature flags               |
| `bump`              | PDA bump seed                                         |

Validation (in the program):

* `primary_relay_uri.len() <= MAX_URI_LEN`
* `backup_relay_uri.len() <= MAX_URI_LEN`
* `handle.len() <= MAX_HANDLE_LEN`

---

## 5. Instructions

The program exposes three instructions: `init_mrr`, `update_mrr`, and `close_mrr`.

### 5.1 `init_mrr`

Initialize a new MRR for the calling wallet.

**Accounts**

* `owner` – signer, writable (wallet that will own the MRR)
* `mrr` – writable PDA, derived from `["mrr", owner]`
* `system_program` – Solana System Program

**Args**

1. `enc_pubkey: [u8; 32]`
2. `primary_relay_uri: String`
3. `backup_relay_uri: String`
4. `handle: String`
5. `capabilities: u32`

Fails if an MRR PDA already exists for this owner or if string length checks fail.

---

### 5.2 `update_mrr`

Update an existing MRR record.

**Accounts**

* `owner` – signer, writable (must match `mrr.owner`)
* `mrr` – writable PDA (existing MRR account)

**Args**

1. `enc_pubkey: [u8; 32]`
2. `primary_relay_uri: String`
3. `backup_relay_uri: String`
4. `handle: String`
5. `capabilities: u32`

Used for:

* Key rotation
* Relay changes
* Handle updates
* Capability flag changes

---

### 5.3 `close_mrr`

Close the MRR account and reclaim rent.

**Accounts**

* `owner` – signer, writable (receives reclaimed lamports)
* `mrr` – writable PDA (MRR account to be closed)

After closing, there is no active MRR for that wallet.

---

## 6. Usage Flow (High Level)

### 6.1 Wallet setup

1. Wallet generates an encryption keypair (off-chain).
2. Wallet calls `init_mrr` with:

   * `enc_pubkey` bytes
   * `primary_relay_uri` (+ optional backup)
   * `handle` and `capabilities`

Now anyone can derive the PDA and read how to reach this wallet.

---

### 6.2 Sender workflow

Given a wallet address:

1. Derive the MRR PDA (`["mrr", owner]`).
2. Fetch the account and read:

   * `enc_pubkey`
   * `primary_relay_uri` / `backup_relay_uri`
3. Encrypt the message off-chain.
4. POST ciphertext to the relay URI.

---

### 6.3 Receiver / relay workflow

* The relay delivers ciphertext out-of-band (websocket, HTTP poll, etc.).
* Receiver’s wallet / app:

  * Fetches ciphertext from the relay.
  * Decrypts locally using the private key corresponding to `enc_pubkey`.
  * Renders the message in some UI.

MRR itself does **not** care how the relay works or how the UI is built.

---

### 6.4 Rotation and opt-out

* To rotate keys or change relays/handle, call `update_mrr`.
* To opt-out entirely, call `close_mrr` to remove the record and reclaim rent.

---

## 7. Status

* **Network:** Devnet
* **Security:** Not audited – experimental / alpha.
* **Intended users:** Wallet / relay / infra devs experimenting with wallet-linked messaging profiles, not end users directly.
