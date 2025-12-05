import * as anchor from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { MrrClient } from "./src";

(async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const owner = provider.wallet.publicKey;
  console.log("Wallet owner:", owner.toBase58());

  const client = new MrrClient(provider);

  // 1) Try to fetch an existing MRR first
  try {
    const existing = await client.fetch(owner);
    console.log("Existing MRR record found:");
    console.log(existing);
    return; // nothing else to do
  } catch (e: any) {
    // If it's "account does not exist", we fall through and initialize
    const msg = e?.toString?.() ?? "";
    if (!msg.includes("Account does not exist")) {
      console.error("Unexpected error while fetching MRR:", e);
      return;
    }
    console.log("No existing MRR record found. Initializing a new one…");
  }

  // 2) No record yet → initialize once
  const inbox = Keypair.generate().publicKey;
  console.log("Inbox key:", inbox.toBase58());

  const encPubkey = inbox.toBytes(); // [u8;32] as bytes

  const sig = await client.initialize({
    encPubkey,
    primaryRelayUri: "https://relay.example.com",
    backupRelayUri: "",
    handle: "mrr-devnet-demo",
    capabilities: 0,
  });

  console.log("Initialized MRR, tx:", sig);

  // 3) Fetch and show it
  const created = await client.fetch(owner);
  console.log("Created MRR record:");
  console.log(created);
})();
