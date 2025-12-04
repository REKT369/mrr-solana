# Integrating MRR Into Wallets

Wallets can:

- Write MRR when user enables messaging
- Rotate inbox keys
- Read others’ MRR PDAs for routing

### PDA lookup

PDA = Pubkey.findProgramAddress(
["mrr", owner_pubkey],
PROGRAM_ID
)

markdown
Copy code

### What wallets store

- inbox private key (off-chain)
- optional relay preferences

### Rendering in UI

Example:

**Messaging Profile**
- Relay: relay.solana.chat
- Handle: rekt
- Inbox key: 9fjk…sx2
