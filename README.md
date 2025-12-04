
---

## `README.md`

```markdown
# mrr-solana

**MRR (Message Routing Record)** – a tiny on-chain primitive for **wallet messaging profiles** on Solana.

Program: `mrr_solana`  
Network: **Devnet**  
Program ID: `61cVB9Sj5dWWGk5fUfPCCvwpRtpMds2QW4Q5G7UqaDYV`

Instead of everyone inventing their own “DM endpoint” format, MRR gives every wallet a single, canonical record:

> “If you want to send me encrypted messages, use this public key and this relay URI.”

The program doesn’t move messages, doesn’t do inboxes, doesn’t care how you encrypt. It just publishes a stable **routing profile** per wallet that relays, wallets and apps can agree on.

---

## What lives on-chain

Each wallet can have **at most one** MRR, stored as a PDA:

```text
PDA seeds: ["mrr", owner_pubkey]
Program:   61cVB9Sj5dWWGk5fUfPCCvwpRtpMds2QW4Q5G7UqaDYV
