import * as anchor from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { MrrClient } from "./dist";

(async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const client = new MrrClient(provider);

  // Generate a fresh inbox keypair (public key stored in MRR, private key stays off-chain)
  const inbox = Keypair.generate().publicKey;

  console.log("Wallet owner:", provider.wallet.publicKey.toBase58());
  console.log("Inbox key:", inbox.toBase58());

  const sig = await client.initialize({
    relayUrl: "https://relay.example.com",
    inboxKey: inbox,
    handle: "mrr-devnet-demo",
  });

  console.log("Initialize MRR tx:", sig);

  const record = await client.fetch(provider.wallet.publicKey);
  console.log("Fetched MRR record:", {
    owner: record?.owner.toBase58(),
    relayUrl: record?.relayUrl,
    inboxKey: record?.inboxKey.toBase58(),
    prevInboxKey: record?.prevInboxKey.toBase58(),
    handle: record?.handle,
    flags: record?.flags,
    bump: record?.bump,
  });
})();
