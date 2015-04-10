var concat = require('concat-stream')

process.stdin.pipe(concat(function (buf) {
  process.stdout.write(JSON.stringify({
    cwd: process.cwd(),
    stdin: buf.toString()
  }))
}))
