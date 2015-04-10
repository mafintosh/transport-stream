# transport-stream

Turn a protocol string into a transport duplex stream.

```
npm install transport-stream
```

[![build status](http://img.shields.io/travis/mafintosh/transport-stream.svg?style=flat)](http://travis-ci.org/mafintosh/transport-stream)

Ships with support for transports that pipes to remote commands over ssh,
piping to the processes spawned on local machine in other folder, http and https.

## Usage

``` js
var transports = require('transport-stream')
var createStream = transports({
  command: 'cat -' // spawn this command when using ssh or the local file system
})

// create a duplex stream that pipes to `spawn-me` on my-server.com
var stream = createStream('ssh://mafintosh@my-server.com:this-cwd')

// create a duplex stream over https
var stream = createStream('https://server.com/test')

// create a duplex stream that pipes to `spawn-me` spawned in /tmp
var stream = createStream('/tmp')
```

## API

#### `createStream = transports(options)`

Create a new transports instance. Options include

``` js
{
  command: 'a-command-to-spawn',
  protocols: {
    // add any custom protocols here
    dat: function (url, options) {
      return aDatProtocolStream(url)
    },
    // or set http: false to disable a build in protocol
    http: false
  }
}
```

If you set the `command` option `file` and `ssh` protocols are enabled per default
in addition to `http` and `https`.

#### `var stream = createStream(url)`

Create a new duplex transport stream based on the protocol used in `url`.
If no suitable protocol is found an exception is thrown.

## License

MIT
