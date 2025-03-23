const express = require("express");
const proxy = require("http-proxy-middleware");

const router = express.Router();

const servers = [
  {
    host: "localhost",
    port: 9000 || 3000,
    weight: 1,
  },
  // we can add more servers here...
];

const proxyOptions = {
  target: "",
  changeOrigin: true,
  onProxReq: (proxReq, req) => {
    // setting custom header
    proxReq.setHeader("X-Own-Proxy-Header", "lazinerd");
  },

  logLevel: "debug",
};

let currentServerIndex = 0;

function getServer() {
  // round robin technique
  currentServerIndex = (currentServerIndex + 1) % servers.length;
  return servers[currentServerIndex];
}

// proxy request
router.all("*", (req, res) => {
  const targetServer = getServer();

  proxyOptions.target = `http://${targetServer.host}:${targetServer.port}`;

  proxy.createProxyMiddleware(proxyOptions);
});

module.exports = router;
