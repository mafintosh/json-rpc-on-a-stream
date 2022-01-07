# json-rpc-on-a-stream

Get JSON RPC on a stream

```
npm install json-rpc-on-a-stream
```

## Usage

``` js
const JRPC = require('json-rpc-on-a-stream')

// a stream to the other person
const rpc = new JRPC(stream)

// send a request
await rpc.request('hello', 'world')

// respond to requests
rpc.respond('hello', async function () {
  return 'sup'
})

// send a request without waiting for a reply
rpc.event('hello')
```

## API

#### `const rpc = new JRPC(stream, [options])`

Make a new RPC instance. You should make one on each side of the stream.

Options include:

```js
{
  binaryStream: true // set to false if you do not need message encoding, ie an object stream
}
```

#### `const reply = await rpc.request(method, params)`

Make a request.

#### `rpc.respond(method, async function respond (params) { ... })`

Respond to requests.

#### `rpc.event(method, param)`

Send a "fire and forget" request, ie an event.

#### `rpc.unrespond(method)`

Remove a responder.

## License

MIT
