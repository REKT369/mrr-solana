# mrr-solana

**MRR (Message Routing Record)** — a minimal, universal on-chain primitive for **wallet messaging profiles** on Solana.


Program: `mrr_solana`

Network: **Devnet**

Program ID: `61cVB9Sj5dWWGk5fUfPCCvwpRtpMds2QW4Q5G7UqaDYV`


Instead of every wallet, dApp, or inbox inventing their own “DM endpoint format,” MRR standardizes a simple routing profile:

> “If you want to send me encrypted messages, use this public key and this relay URL.”

MRR does **not** store messages or ciphertext. It does not define an inbox. It only stores the **routing metadata** that off-chain relays and encrypted protocols can rely on.

---

## What MRR Provides

Each wallet can have **one routing record**, stored at a deterministic PDA:

```
Seeds: ["mrr", owner_pubkey]
Program: 61cVB9Sj5dWWGk5fUfPCCvwpRtpMds2QW4Q5G7UqaDYV
```

From this single PDA, apps can discover:

* Which relay endpoint to send encrypted payloads to
* What public key to encrypt messages with
* The wallet’s optional display handle
* Capability flags for future extensions

That’s it. A simple directory entry.

---

## On-Chain Data Layout

The MRR account is:

```rust
pub struct Mrr {
    pub owner: Pubkey,           // wallet controlling the PDA
    pub relay_url: String,       // off-chain relay endpoint
    pub inbox_key: Pubkey,       // inbox/encryption key
    pub prev_inbox_key: Pubkey,  // old key (grace period rotation)
    pub handle: String,          // optional username/tag
    pub flags: u8,               // capability bitfield
    pub bump: u8,                // PDA bump
}
```

Field summary:

* **owner** — only this wallet can update the record
* **relay_url** — where ciphertext should be delivered
* **inbox_key** — encrypt-to key for messages
* **prev_inbox_key** — smooth key rotation
* **handle** — optional identifier
* **flags** — reserved for future extensions
* **bump** — PDA bump

---

## Instructions

### 1. `initialize_mrr`

Creates the PDA and sets the routing profile.

Inputs:

* relay URL
* inbox public key
* optional handle
* optional flags

### 2. `update_mrr`

Updates any fields:

* rotate inbox key
* update relay endpoint
* update handle
* update flags

Only the PDA owner may call this.

### 3. `close_mrr`

Closes the PDA and returns rent to the owner.

---

## Example Flow

### Wallet setup

1. Wallet generates an inbox keypair.
2. Calls `initialize_mrr`.
3. Now any sender can query the PDA to find how to DM them.

### Sender

1. Derives PDA from `["mrr", owner]`.
2. Reads relay URL + inbox key.
3. Encrypts message.
4. Sends ciphertext to relay.

### Receiver

1. Relay delivers ciphertext off-chain.
2. Wallet decrypts using inbox key.
3. UI displays message however it wants.

---

## Security Philosophy

MRR intentionally keeps the on-chain surface minimal:

* Solana handles identity
* Relays handle transport
* Wallets handle decryption

No assumptions are made about protocol, payload format, or UX.

---

## Extensibility

`flags` can describe future capabilities:

* Multiple relays
* Multiple inbox keys
* Signed relay challenges
* Protocol versioning
* Email/DM bridges
* Experimental wallet messaging formats

Because the primitive is tiny and stable, layers can evolve independently on top of it.

---

## 📡 Status

MRR v1 (Devnet) is deployed and deterministic.

Program ID:

```
61cVB9Sj5dWWGk5fUfPCCvwpRtpMds2QW4Q5G7UqaDYV
```

This repo contains:

* Anchor program (`programs/mrr_solana`)
* IDL output (`idl/mrr_solana.json`)
* SPEC.md (full protocol reference)

More SDKs and examples coming soon.

---

## License

Apache-2.0.
Feel free to build on top.

---

## How MRR Works

MRR acts as a **public routing profile** that any wallet, relay, or messaging app can read from the Solana blockchain.
It stores *only* the minimal metadata needed so encrypted messages can be delivered *off-chain*.

### **High-Level Flow**

```
+------------------------+          +---------------------+
|        Sender          |          |      Receiver       |
|  (wallet or app)       |          |     (wallet)        |
+-----------+------------+          +-----------+---------+
            |                                   ^
            |                                   |
            | 1. Fetch receiver's MRR PDA       |
            +-----------------------------------+
            |                                   |
            v                                   |
+------------------------+                      |
|   Solana Blockchain    |                      |
|  MRR PDA (per wallet)  |                      |
|------------------------|                      |
| owner pubkey           |                      |
| encPubkey              | ---> for encryption  |
| primaryRelayUri        | ---> where to send   |
| backupRelayUri         |                      |
| handle                 |                      |
| capabilities           |                      |
+-----------+------------+                      |
            |                                   |
            | 2. Encrypt message using         |
            |    `encPubkey`                   |
            +--------------------+              |
            |                    |              |
            v                    |              |
+------------------------+       |              |
|      Sender’s App      | 3. POST ciphertext   |
|  (encrypts + packages) |--------------------->|
+------------------------+                      |
                                               v
                                  +---------------------------+
                                  |        Relay Server       |
                                  | (off-chain message router)|
                                  +-------------+-------------+
                                                |
                                                | 4. Push ciphertext
                                                v
                                  +---------------------------+
                                  |     Receiver’s Wallet     |
                                  | (decrypt using privkey)   |
                                  +---------------------------+
                                                |
                                                | 5. Display message
                                                v
                               +--------------------------------------+
                               |     Inbox / Messaging Application    |
                               +--------------------------------------+
```

---

## What Actually Happens (Step-by-Step)

### **1. Sender fetches the recipient’s MRR**

The sender looks up the PDA:

```
PDA = findProgramAddress(["mrr", recipient_pubkey])
```

From this PDA, the sender learns:

*  **encPubkey** → public key used to encrypt messages
*  **primaryRelayUri** → where ciphertext should be delivered
*  **handle** → optional display name
*  **capabilities** → what features the wallet supports

### **2. Sender encrypts the message**

Using `encPubkey`, the sender encrypts the content **client-side**, off-chain.

MRR never stores or touches ciphertext.

### **3. Sender delivers ciphertext to the relay**

The relay URL in the MRR determines where to send:

```
POST /deliver
{
  to: <recipient_wallet>,
  ciphertext: <encrypted bytes>
}
```

Relays can be:

* centralized
* decentralized
* p2p mesh
* inbox-as-a-service
* your own hosted node

MRR **doesn’t care** — it just points to the endpoint.

### **4. Relay forwards encrypted message to the recipient**

The relay pushes the ciphertext to the receiver’s device, inbox, app, or notification system.

### **5. Receiver decrypts client-side**

Using their private inbox keypair (not stored on-chain), the receiver decrypts the payload.

---

## Why This Architecture Works

### ✔ Minimal on-chain footprint

Only routing metadata lives on-chain — extremely cheap and future-proof.

### ✔ Supports *any* messaging protocol

E2EE? P2P? WebRTC? Matrix? XMTP-style inbox?
All possible — nothing in MRR restricts you.

### ✔ Zero custody, zero liability

MRR does **not** handle:

* keys
* messages
* storage
* moderation

You are only publishing a “where to reach me” record.

### ✔ Pluggable relays

Anyone can run a relay.
Wallets can choose preferred relays.
Apps can spin up optional relay networks.

### ✔ Extremely easy to integrate

One PDA lookup gives all the sender needs.

---
