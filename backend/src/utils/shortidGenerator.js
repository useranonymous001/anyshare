const uniqueID = require("short-unique-id");

const generateUniqueID = () => {
  const shortId = new uniqueID({ length: 15 });

  return shortId.rnd();
};

module.exports = generateUniqueID;
