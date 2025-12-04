# MRR: Message Routing Record (Solana)

**Program:** `mrr_solana`  
**Network:** Solana Devnet  
**Program ID:** `61cVB9Sj5dWWGk5fUfPCCvwpRtpMds2QW4Q5G7UqaDYV`

MRR (Message Routing Record) is a minimal on-chain primitive that lets any Solana wallet publish a **messaging routing profile**:

> “If you want to send me encrypted messages, use this public key and this relay URL.”

MRR is intentionally tiny and non-opinionated:

- One PDA per wallet  
- Small fixed-size fields  
- No messages or ciphertext stored on-chain  
- No inbox  
- No off-chain dependencies baked in  

It acts purely as a **directory entry** for wallets, relays, and apps.

---

## 1. Goals

### **1. Minimal, universal primitive**
MRR provides *just enough* on-chain state so senders know how to reach you off-chain.

### **2. One record per wallet**
Each wallet controls a single PDA, easy to fetch & verify.

### **3. Key rotation support**
Wallets can rotate encryption keys safely.

### **4. Interop-friendly**
Any messaging protocol can build on top:

- Wallet-to-wallet encrypted DM  
- Email-like bridges  
- App-level messaging  
- QR “send me a message” codes  

---

## 2. Non-Goals

MRR deliberately does **not**:

- Store messages  
- Store ciphertext  
- Provide inbox UI  
- Provide spam protection  
- Define encryption schemes  
- Define message formatting  

All of this is left to relays, wallets, and apps.

---

## 3. Account Model

Each wallet may initialize **one** MRR account:

PDA seeds: ["mrr", owner_pubkey]
Program: 61cVB9Sj5dWWGk5fUfPCCvwpRtpMds2QW4Q5G7UqaDYV

rust
Copy code

This gives a deterministic address for:

- Fetching your routing record  
- Verifying ownership  
- Building any messaging layer on top  

---

## 4. MRR Data Layout

```rust
pub struct Mrr {
    pub owner: Pubkey,           // wallet controlling the PDA
    pub relay_url: String,       // off-chain relay endpoint
    pub inbox_key: Pubkey,       // encryption/public inbox key
    pub prev_inbox_key: Pubkey,  // optional old key for rotation
    pub handle: String,          // optional username / identifier
    pub flags: u8,               // capability flags
    pub bump: u8,                // PDA bump
}
Field notes
Field	Description
owner	Wallet authorized to update the MRR
relay_url	Where encrypted messages should be delivered off-chain
inbox_key	Public key for encrypting messages
prev_inbox_key	Grace period for key rotation
handle	Optional display handle (e.g. “rekt.sol")
flags	Bitfield: future extensions
bump	PDA bump

5. Instructions
1. initialize_mrr
Creates a PDA for the wallet if not already created.

Input:

relay_url (string)

inbox_key (Pubkey)

optional handle

2. update_mrr
Updates any part of the record:

rotate keys

update relay

update handle

update flags

Only the owner can call this.

3. close_mrr
Closes the PDA and refunds rent.

6. Usage Flow
Wallet Setup
Wallet generates inbox keypair

Wallet calls initialize_mrr with:

relay URL

inbox public key

handle

Sender Workflow
Sender fetches PDA for target wallet

Reads:

relay URL

inbox key

Encrypts message

Pushes ciphertext to that relay

Receiver Workflow
Off-chain relay pushes encrypted message

Wallet decrypts

UI displays message

Everything except the routing info happens off-chain.

7. Security Model
MRR assumes:

The blockchain provides authenticity for the owner

Relays provide privacy + message delivery

Wallet UI provides decryption

MRR publishes the minimum surface area required to route encrypted data.

8. Extensibility
Future capabilities via flags:

supports ephemeral key rotation

supports multiple relays

supports multi-inbox setups

supports wallet-linked email

supports interoperable DM providers

MRR is intentionally “dumb.”
Everything powerful sits on top.

9. Status
MRR v1 (Devnet) is live.
Contracts: deterministic, stable, and minimal.
