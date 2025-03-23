const https = require("https");
const fs = require("fs");

const options = {
  key: fs.readFileSync("../ssl/key.pem"),
  cert: fs.readFileSync("../ssl/cert.pem"),
};

https.createServer(options).listen(443, () => {
  //   app.use(proxyRoute);
  console.log(`loadbalancer started at port 443`);
});
