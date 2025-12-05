import * as anchor from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { MrrClient } from "./src";

(async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const client = new MrrClient(provider);

  const owner = provider.wallet.publicKey;
  const inboxKey = Keypair.generate().publicKey;

  console.log("Wallet owner:", owner.toBase58());
  console.log("Inbox key:", inboxKey.toBase58());

  const sig = await client.initialize({
    encPubkey: inboxKey,
    primaryRelayUri: "https://relay.example.com",
    backupRelayUri: "",
    handle: "mrr-devnet-demo",
    capabilities: 0,
  });

  console.log("Initialized MRR, tx:", sig);

  const record = await client.fetch(owner);
  console.log("Fetched MRR account:", record);
})();
