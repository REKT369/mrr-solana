# MRR: Message Routing Record (Solana)

**Program:** `mrr_solana`  
**Network:** Solana Devnet  
**Program ID:** `61cVB9Sj5dWWGk5fUfPCCvwpRtpMds2QW4Q5G7UqaDYV`  

MRR (Message Routing Record) is a minimal on-chain primitive that lets any Solana wallet address publish a **messaging routing profile**:

> “If you want to send me encrypted messages, use this public key and this relay URL.”

It’s deliberately small:

- 1 PDA per wallet  
- A few strings + flags  
- No opinions about which relay, which protocol, or which UI  

This makes it easy for wallets, dApps, and off-chain relays to integrate without trusting any central service.

---

## 1. Goals

- **Simple primitive, not a whole protocol**  
  On-chain: only enough data for senders to find how to reach you.  
  Off-chain: relays / inbox UIs decide how to actually move ciphertext around.

- **Per-wallet, updatable record**  
  1 MRR per wallet (PDA).  
  Wallet can rotate its encryption key, update its relay, or change handle/capabilities.

- **Good enough for:**
  - Wallet-to-wallet messaging  
  - “DM me” QR codes  
  - Wallet-linked email / DM bridges  
  - Cross-app messaging profiles  

---

## 2. Non-Goals

MRR does **not**:

- Store messages or ciphertext on-chain  
- Define a full messaging protocol, threads, or inbox UX  
- Handle spam / reputation / payment gating  
- Do key management beyond “here is the current encryption key and the previous one”  

All of that is left to off-chain rails and higher-level standards.

---

## 3. Account Model

Each wallet can have at most **one** MRR, stored as a PDA:

```text
PDA seeds: ["mrr", owner_pubkey]
Program:   61cVB9Sj5dWWGk5fUfPCCvwpRtpMds2QW4Q5G7UqaDYV

