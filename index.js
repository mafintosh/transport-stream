var url = require('url')
var pumpify = require('pumpify')
var file = require('fs-transport-stream')
var ssh = require('ssh-transport-stream')
var http = require('http-transport-stream')
var debug = require('debug')('transport-stream')
var debugStream = require('debug-stream')

var loggers = {
  out: debugStream(debugLogger('out')),
  in: debugStream(debugLogger('in'))
}

module.exports = function (opts) {
  var protocols = (opts && opts.protocols) || {}
  var cmd = opts && opts.command
  if (!cmd) throw new Error('Must specify command')

  return function (transport) {
    var transportStream = getTransport()
    if (!loggers.out.enabled) return transportStream
    else return pumpify(loggers.out(), transportStream, loggers.in())

    function getTransport () {
      if (!transport) throw new Error('Transport required')

      var u = url.parse(transport)
      var protocolName = u.protocol ? u.protocol.slice(0, -1) : 'file'
      var custom = protocols[protocolName]

      if (custom) return custom(transport, opts, u)

      if (custom !== false) {
        if (cmd && protocolName === 'ssh') return ssh(transport, cmd)
        if (cmd && protocolName === 'file') return file(transport, cmd)
        if (protocolName === 'http' || protocolName === 'https') return http(transport)
      }

      throw new Error('Unsupported protocol')
    }
  }
}

function debugLogger (prefix) {
  return function (buf) {
    debug(prefix, {length: buf.length, data: buf.toString()})
  }
}
