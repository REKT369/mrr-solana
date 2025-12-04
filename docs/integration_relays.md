# MRR for Relays (Off-chain Messaging)

Relays read MRR on-chain to know:

- inbox public key  
- relay URL  
- handle  
- capabilities  

Then they deliver encrypted payloads off-chain.

**Relays DO NOT write to chain.**

Flow:

1. Sender fetches MRR of receiver
2. Encrypts message using inbox key
3. POST ciphertext to relay URL
4. Relay pushes or queues
5. Receiver decrypts locally
