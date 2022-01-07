const NewlineDecoder = require('newline-decoder')

module.exports = class RPC {
  constructor (stream, { binaryStream = true } = {}) {
    this.binaryStream = binaryStream
    this.id = 1
    this.requests = new Map()
    this.responders = new Map()
    this.stream = stream

    this.stream.on('data', this.binaryStream ? this._onbinarydata.bind(this) : this._onmessage.bind(this))
    this.stream.on('error', (err) => this._abortAll(err))
    this.stream.on('end', () => this.end())
    this.stream.on('close', () => this._abortAll(new Error('Stream closed')))

    this._ending = false
    this._responding = 0
    this._decoder = binaryStream ? new NewlineDecoder() : null
  }

  respond (method, onrequest) {
    this.responders.set(method, onrequest)
  }

  unrespond (method) {
    this.responders.delete(method)
  }

  request (method, params) {
    return new Promise((resolve, reject) => {
      const id = this.id++
      this.requests.set(id, [resolve, reject])
      this._write({ method, params, id })
    })
  }

  event (method, params) {
    this._write({ method, params, id: 0 })
  }

  end () {
    this._ending = true
    if (this._responding === 0) this.stream.end()
  }

  destroy (err) {
    this.stream.destroy(err)
  }

  _abortAll (err) {
    for (const [, reject] of this.requests.values()) reject(err)
    this.requests.clear()
  }

  _write (m) {
    this.stream.write(this.binaryStream ? JSON.stringify(m) + '\n' : m)
  }

  async _onmessage (m) {
    if (!m) return

    if (!m.method) {
      const req = this.requests.get(m.id)
      if (!req) return
      if (m.error) req[1](new Error(m.error))
      else req[0](m.result)
      return
    }

    const respond = this.responders.get(m.method)

    let error = null
    let result = null

    this._responding++
    try {
      if (!respond) throw new Error('Unknown method')
      result = await respond(m.params)
    } catch (err) {
      error = err.message
    }
    this._responding--

    if (m.id) this._write({ result, error, id: m.id })
    if (this._responding === 0 && this._ending) this.stream.end()
  }

  _onbinarydata (b) {
    for (const str of this._decoder.push(b)) {
      try {
        this._onmessage(JSON.parse(str))
      } catch (err) {
        this.destroy(err)
        return
      }
    }
  }
}
