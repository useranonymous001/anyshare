const https = require("https");
const express = require("express");
const axios = require("axios");
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
    weight: 5, // capacity of the server to handle requests
    isAlive: true,
  },
];

let currentServerIndex = 0;

// func to check the server health
async function checkServerHealth(server) {
  try {
    const res = await axios.get(`http://${server.host}:${server.port}/health`);

    if (res.status === 200) {
      server.isAlive = true;
    }
  } catch (error) {
    server.isAlive = false;
  }
}

setInterval(() => {
  servers.forEach((s) => {
    checkServerHealth(s);
  });
}, 5000);

// using round robin algorithm
function getHealthyServer() {
  const healthyServers = servers.filter((s) => s.isAlive);
  currentServerIndex = (currentServerIndex + 1) % healthyServers.length;

  if (healthyServers.length === 0) {
    console.error(`No backend server is alive`);
  }

  return healthyServers[currentServerIndex];
}

// using proxy middlewares
app.use((req, res, next) => {
  const targetServer = getHealthyServer();
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
