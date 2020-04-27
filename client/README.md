Picking up where [Enigma Blockchain Developer Experience](https://github.com/enigmampc/enigma-blockchain-contracts-guide) guide leaves off, lets use cosmwasm-js to interact with the blockchain, instead of enigmacli.


# Resources
- [cosmwasmclient-part-1](https://medium.com/confio/cosmwasmclient-part-1-reading-e0313472a158)
- [cosmwasmclient-part-2](https://medium.com/confio/cosmwasmclient-part-2-writing-dfb608f1a7f9)


## CosmWasmClient Part 1: Reading

```bash
# Start enigmachain
docker run -d -p 26657:26657 -p 26656:26656 -p 1317:1317 \
 -v ~/.enigmad:/root/.enigmad -v ~/.enigmacli:/root/.enigmacli \
 -v $(pwd):/code \
 --name enigmadev enigmadev
```

```bash
# Start the rest server
docker exec enigmadev \
  enigmacli rest-server \
  --node tcp://localhost:26657 \
  --trust-node \
  --laddr tcp://0.0.0.0:1317
```

```bash
# start cosmwasm-cli
npx @cosmwasm/cli  
```

```js
// connect to rest server, for querying, the CosmWasmClient will suffice
const client = new CosmWasmClient("http://localhost:1317")

// query chain ID
await client.getChainId()

// query chain height
await client.getHeight()

// Get deployed code
await client.getCodes()

// Get the contracts for our simple counter
const contracts = await client.getContracts(1)

const contractAddress = contracts[0].address

// Query the current count
let count = await client.queryContractSmart(contractAddress, { "get_count": {}})

// Note the result is JSON, so we have to parse it

JSON.parse(fromUtf8(count))
```

## CosmWasmClient Part 2: Writing

To increment our counter and change state, we have to connect our wallet

```bash
# start cosmwasm-cli as before, this time importing src/helpers to configure fees etc

npx @cosmwasm/cli --init src/helpers.ts
```

```js
.editor
const enigmaOptions = {
  httpUrl: "http://localhost:1317",
  networkId: "enigma-testnet",
  feeToken: "uscrt",
  gasPrice: 0.025,
  bech32prefix: "enigma",
}

//  foo.key here is one of the genesis accounts used in enigmadev
const mnemonic = loadOrCreateMnemonic("foo.key");

// connect the wallet, this time client is a SigningCosmWasmClient, to sign txs.
const {address, client} = await connect(mnemonic, enigmaOptions);

// Check account
await client.getAccount()

// Upload the contract
const wasm = fs.readFileSync("../contract.wasm")
client.upload(wasm, {})

// If successfully uploaded, we should have a contract code
await client.getCodes()

const codeId = 1

// Create an instance
const initMsg = {"count": 0}

client.instantiate(codeId, initMsg, "My Simple Counter")

// Get the contracts for our simple counter
const contracts = await client.getContracts(1)

const contractAddress = contracts[0].address

// and because we imported the helpers, we can use smartQuery instead of client.queryContractSmart
smartQuery(client, contractAddress, { get_count: {} })

// The message to increment the counter requires no params
const handleMsg = { increment: {} }

// execute the message
client.execute(contractAddress, handleMsg);

// Query again to confirm it worked
smartQuery(client, contractAddress, { get_count: {} })

```