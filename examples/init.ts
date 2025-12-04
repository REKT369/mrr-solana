import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { initializeMrr } from "../sdk/mrr";

(async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const inboxKey = Keypair.generate().publicKey;

  const sig = await initializeMrr(
    provider,
    "https://relay.example.com",
    inboxKey,
    "example-handle"
  );

  console.log("MRR initialized:", sig);
})();
