const micro = require('micro');
const index = require('./src/index');
const server = micro(index);

server.listen(process.env.PORT || 3000)