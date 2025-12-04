# MRR Solana TypeScript SDK

TypeScript SDK for the **MRR (Message Routing Record)** program on Solana.

#### Program ID (Devnet): 61cVB9Sj5dWWGk5fUfPCCvwpRtpMds2QW4Q5G7UqaDYV


This SDK provides:

PDA helpers

High-level client methods to:

initialize an MRR

update an MRR

close an MRR

fetch an MRR account

It assumes your repo has the Anchor IDL at:

text
Copy code
idl/mrr_solana.json
Install
From the repo root:

bash
Copy code
cd clients/ts-mrr
npm install
npm run build
Usage
Example (Node / ts-node):

ts
Copy code
import * as anchor from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { MrrClient, getMrrPda, MRR_PROGRAM_ID } from "./dist";

(async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const client = new MrrClient(provider);

  const inbox = Keypair.generate().publicKey;

  const sig = await client.initialize({
    relayUrl: "https://relay.example.com",
    inboxKey: inbox,
    handle: "rekt"
  });

  console.log("Initialized MRR, tx:", sig);

  const owner = provider.wallet.publicKey;
  const record = await client.fetch(owner);
  console.log("MRR record:", record);
})();
See src/client.ts for the full surface.
