var duplexify = require('duplexify')
var exec = require('ssh-exec')
var execspawn = require('execspawn')
var url = require('url')
var fs = require('fs')
var http = require('http')
var https = require('https')

var destroy = function () {
  this.destroy()
}

var error = function (res) {
  var err = new Error('Request failed')
  err.status = res.statusCode
  err.headers = res.headers
  return err
}

var request = function (mod, cmd, u) {
  var stream = duplexify()
  var headers = {}

  if (cmd) headers['X-Command'] = cmd
  if (u.auth) headers.Authorization = 'Basic ' + new Buffer(u.auth).toString('base64')

  var req = mod.request({
    method: 'POST',
    path: u.path,
    port: u.port,
    host: u.hostname,
    headers: headers
  })

  stream.setWritable(req)
  req.on('response', function (res) {
    if (!/2\d\d/.test(res.statusCode)) return stream.destroy(error(res))
    stream.setReadable(res)
  })

  return stream
}

var ssh = function (cmd, u) {
  var cwd = u.path ? u.path.slice(2) : ''
  cmd = 'PATH="$PATH:/usr/local/bin" ' + cmd
  if (cwd) cmd = 'cd ' + JSON.stringify(cwd) + '; ' + cmd
  return exec(cmd, {user: u.auth || process.env.USER, host: u.host})
}

var fileMaybe = function (cmd, transport) {
  var stream = duplexify()

  fs.stat(transport, function (err, st) {
    if (stream.destroyed) return
    if (err) return stream.destroy(err)
    if (!st.isDirectory()) return stream.destroy(new Error('Not a directory'))

    var child = execspawn(cmd, {cwd: transport})

    stream.setReadable(child.stdout)
    stream.setWritable(child.stdin)
    child.stderr.resume()
  })

  return stream
}

module.exports = function (opts) {
  var protocols = (opts && opts.protocols) || {}
  var cmd = opts && opts.command

  return function (transport) {
    if (!transport) throw new Error('Transport required')
    if (transport === '-') return duplexify(process.stdout, process.stdin, {end: false}).on('finish', destroy)

    var u = url.parse(transport)
    var protocolName = u.protocol ? u.protocol.slice(0, -1) : 'file'
    var custom = protocols[protocolName]

    if (custom) return custom(transport, opts, u)

    if (custom !== false) {
      if (cmd && protocolName === 'ssh') return ssh(cmd, u)
      if (cmd && protocolName === 'file') return fileMaybe(cmd, transport.replace(/^file:\/\//, ''))
      if (protocolName === 'http') return request(http, cmd, u)
      if (protocolName === 'https') return request(https, cmd, u)
    }

    throw new Error('Unsupported protocol')
  }
}
