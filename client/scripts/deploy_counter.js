#!/usr/bin/env node

/* eslint-disable @typescript-eslint/camelcase */
const { SigningCosmWasmClient, Secp256k1Pen } = require("@cosmwasm/sdk");
const fs = require("fs");
const {loadOrCreateMnemonic, connect } = require("./helpers.ts");


async function main() {

  const enigmaOptions = {
    httpUrl: "http://localhost:1317",
    networkId: "enigma-testnet",
    feeToken: "uscrt",
    gasPrice: 0.025,
    bech32prefix: "enigma",
  }

  const mnemonic = loadOrCreateMnemonic("foo.key");
  const {address, client} = await connect(mnemonic, enigmaOptions);

  // const pen = await Secp256k1Pen.fromMnemonic(faucet.mnemonic);
  // const client = new SigningCosmWasmClient(httpUrl, faucet.address, signBytes => pen.sign(signBytes));

  const wasm = fs.readFileSync(__dirname + "../contracts/counter.wasm");
  const uploadReceipt = client.upload(wasm, {})
  console.info(`Upload succeeded. Receipt: ${JSON.stringify(uploadReceipt)}`);

  const memo = `Counter`;
  const initMsg = {"count": 0}
  const { contractAddress } = await client.instantiate(uploadReceipt.codeId, initMsg, memo);
  console.info(`Contract instantiated at ${contractAddress}`);
}

main().then(
  () => {
    console.info("Counter deployed.");
    process.exit(0);
  },
  error => {
    console.error(error);
    process.exit(1);
  },
);


