# MRR Quickstart (Solana Devnet)

MRR = Message Routing Record  
A tiny on-chain primitive for wallet messaging profiles.

## 1. Install

npm install @coral-xyz/anchor

## 2. Derive PDA

const [pda] = await getMrrPda(walletPubkey)

## 3. Initialize MRR
await initializeMrr(
  provider,
  "https://relay.example.com",
  inboxKey,
  "rekt"
);

## 4. Update MRR
await updateMrr(provider, {
  relayUrl: "https://new-relay.com",
});

## 5. Fetch MRR
const rec = await fetchMrr(provider, owner);
console.log(rec);
