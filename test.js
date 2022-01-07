const test = require('brittle')
const JRPC = require('./')
const net = require('net')

test('basic', async function (t) {
  const [client, server] = await pair(t)

  const a = new JRPC(client)
  const b = new JRPC(server)

  b.respond('echo', function (params) {
    return {
      echo: params
    }
  })

  {
    const r = await a.request('echo', 'hello world')
    t.alike(r, { echo: 'hello world' })
  }

  {
    const r = await a.request('echo', 'hej verden')
    t.alike(r, { echo: 'hej verden' })
  }
})

function pair (t) {
  return new Promise((resolve) => {
    let client
    const server = net.createServer(function (serverStream) {
      resolve([client, serverStream])
      t.teardown(function () {
        server.close()
        client.on('error', () => {})
        client.destroy()
        serverStream.on('error', () => {})
        serverStream.destroy()
      })
    })

    server.listen(0, function () {
      client = net.connect(server.address().port)
    })
  })
}
