const https = require("https");
const express = require("express");
const fs = require("fs");
const {
  createProxyMiddleware,
  proxyEventsPlugin,
  debugProxyErrorsPlugin,
  errorResponsePlugin,
  loggerPlugin,
} = require("http-proxy-middleware");

const app = express();

const options = {
  key: fs.readFileSync("../ssl/key.pem"),
  cert: fs.readFileSync("../ssl/cert.pem"),
};

const servers = [
  {
    host: "localhost",
    port: 9000,
    weight: 1,
  },
];

let currentServerIndex = 0;

// using round robin algorithm
function getServer() {
  currentServerIndex = (currentServerIndex + 1) % servers.length;
  return servers[currentServerIndex];
}

// using proxy middlewares
app.use((req, res, next) => {
  const targetServer = getServer();
  const target = `http://${targetServer.host}:${targetServer.port}`;

  console.log(`Forwarding request to ${target}`);
  console.log("req for: ", req.url);

  createProxyMiddleware({
    target,
    changeOrigin: true,
    logger: console,
    pathRewrite: (path, req) => path,
    ejectPlugins: true,
    plugins: [
      debugProxyErrorsPlugin,
      proxyEventsPlugin,
      errorResponsePlugin,
      loggerPlugin,
    ],
  })(req, res, next);
});

https.createServer(options, app).listen(443, () => {
  console.log(`loadbalancer started at port 443`);
});
