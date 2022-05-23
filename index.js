const http = require('http');
const url = require('url')

const port = process.env.PORT || 3000;
const env = process.env.ENV || 'dev';




function generateData(nbr) {
  const items = [];
  for (let i = 0; i < nbr; i++) {
    items.push(Math.floor((Math.random() * 100) + 100));
  }
  return items;
}

const datas = {
  'test': [1, 2, 3, 4, 5],
  'dev': generateData(5),
  'preprod': generateData(10),
  'prod': generateData(100),
};

const transformers = {
  'external': data => ({ label: 'raw values for external caller', caller: 'external', env: env, values: data }),
  'internal': data => ({ label: 'tuned values for internal caller', caller: 'internal', env: env, values: data.map(v => v + 100) }),
  'none': _ => ({ error: 'unknown caller' }),
};

const requestHandler = (request, response) => {
  const caller = request.headers['X-Caller-Key'] || request.headers['x-caller-key'] || 'none';
  const data = datas[env] || [];
  const transformer = transformers[caller] || ((data) => ({ error: `bad caller ${caller}` }));
  response.writeHead(200, { 'Content-Type': 'application/json', 'X-Caller-Was': caller });
  response.write(JSON.stringify(transformer(data)));
  response.end();
};
const healthHandler = (_, response) => {
  response.writeHead(200, { 'Content-Type': 'application/json' });
  response.write(JSON.stringify({health: 'ok'}));
  response.end();
};

const routes = {
  '/': requestHandler,
  '/health': healthHandler
}

const server = http.createServer((request, response) => {
  const parts = url.parse(request.url);
  console.log({parts})
  const route = routes[parts.pathname]; 
  
  if (route) {
    route(request, response);
  } else {
    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.write(JSON.stringify({ error: 'Not Found' }));
    response.end();
  }
});
server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }
  console.log(`API ${env} is listening on ${port}`)
});