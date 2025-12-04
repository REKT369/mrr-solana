"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMrrPda = getMrrPda;
const web3_js_1 = require("@solana/web3.js");
const constants_1 = require("./constants");
/**
 * Derive the PDA for a wallet's Message Routing Record.
 *
 * Seeds: ["mrr", owner_pubkey]
 */
function getMrrPda(owner) {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("mrr"), owner.toBuffer()], constants_1.MRR_PROGRAM_ID);
}
