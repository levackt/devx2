// import axios from "axios";
// import * as fs from "fs";
// import { encodeSecp256k1Pubkey, encodeSecp256k1Signature, logs, makeSignBytes, marshalTx, Pen, pubkeyToAddress, RestClient, Secp256k1Pen, types, Account, Block, BlockHeader, Code, CodeDetails, Contract, ContractDetails, CosmWasmClient, GetNonceResult, IndexedTx, PostTxResult, SearchByHeightQuery, SearchByIdQuery, SearchBySentFromOrToQuery, SearchByTagsQuery, SearchTxQuery, SearchTxFilter, ExecuteResult, FeeTable, InstantiateResult, SigningCallback, SigningCosmWasmClient, UploadMeta, UploadResult } from "@cosmwasm/sdk";
// import { Bip39, Ed25519, Ed25519Keypair, EnglishMnemonic, Random, Secp256k1, Sha256, Sha512, Slip10, Slip10Curve, Slip10RawIndex } from "@iov/crypto"
// import { Bech32, Encoding, Decimal, Int53, Uint32, Uint53, Uint64 } from "@iov/encoding";
// import { assert, sleep } from "@iov/utils"

interface Options {
  httpUrl: string;
  networkId: string;
  feeToken: string;
  gasPrice: number;
  bech32prefix: string;
};

const defaultOptions: Options = {
  httpUrl: "http://localhost:1317",
  networkId: "testing",
  feeToken: "uscrt",
  gasPrice: 0.025,
  bech32prefix: "enigma",
}

const defaultFaucetUrl = "http://localhost:1317/credit";

const buildFeeTable = (feeToken: string, gasPrice: number): FeeTable => {
  const stdFee = (gas: number, denom: string, price: number) => {
    const amount = Math.floor(gas * price);
    return {
      amount: [{ amount: amount.toString(), denom: denom }],
      gas: gas.toString(),
    }
  };

  return {
    upload: stdFee(1000000, feeToken, gasPrice),
    init: stdFee(500000, feeToken, gasPrice),
    exec: stdFee(200000, feeToken, gasPrice),
    send: stdFee(80000, feeToken, gasPrice),
  }
};

const penAddress = (pen: Secp256k1Pen, prefix: string): string => {
  const pubkey = encodeSecp256k1Pubkey(pen.pubkey);
  return pubkeyToAddress(pubkey, prefix);
}

const connect = async (mnemonic: string, opts: Partial<Options>): Promise<{
  client: SigningCosmWasmClient,
  address: string,
}> => {
  const options: Options = {...defaultOptions, ...opts};
  const feeTable = buildFeeTable(options.feeToken, options.gasPrice);
  const pen = await Secp256k1Pen.fromMnemonic(mnemonic);
  const address = penAddress(pen, options.bech32prefix);

  const client = new SigningCosmWasmClient(options.httpUrl, address, signBytes => pen.sign(signBytes), feeTable);
  return {client, address};
};

// smartQuery assumes the content is proper JSON data and parses before returning it
const smartQuery = async (client: CosmWasmClient, addr: string, query: object): Promise<any> => {
  const bin = await client.queryContractSmart(addr, query);
  return JSON.parse(Encoding.fromUtf8(bin));
}

// loadOrCreateMnemonic will try to load a mnemonic from the file.
// If missing, it will generate a random one and save to the file.
//
// This is not secure, but does allow simple developer access to persist a
// mnemonic between sessions
const loadOrCreateMnemonic = (filename: string): string => {
  try {
    const mnemonic = fs.readFileSync(filename, "utf8");
    return mnemonic.trim();
  } catch (err) {
    const mnemonic = Bip39.encode(Random.getBytes(16)).toString();
    fs.writeFileSync(filename, mnemonic, "utf8");
    return mnemonic;
  }
}

const hitFaucet = async (faucetUrl: string, address: string, ticker: string): Promise<void> => {
  const r = await axios.post(defaultFaucetUrl, { ticker, address });
  console.log(r.status);
  console.log(r.data);
}

const randomAddress = async (prefix: string): Promise<string> => {
  const mnemonic = Bip39.encode(Random.getBytes(16)).toString();
  const pen = await Secp256k1Pen.fromMnemonic(mnemonic);
  const pubkey = encodeSecp256k1Pubkey(pen.pubkey);
  return pubkeyToAddress(pubkey, prefix);
}

const downloadWasm = async (url: string): Promise<Uint8Array> => {
  const r = await axios.get(url, { responseType: "arraybuffer"});
  if (r.status !== 200) {
    throw new Error(`Download error: ${r.status}`);
  }
  return r.data;
}

const getAttribute = (logs: readonly logs.Log[], key: string): string|undefined =>
  logs[0].events[0].attributes.find(x => x.key == key)?.value
