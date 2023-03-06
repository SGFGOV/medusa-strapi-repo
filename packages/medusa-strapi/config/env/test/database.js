const fs = require("fs");
module.exports = ({ env }) => {
  const tmpDbFile = env("DATABASE_FILENAME", "test-db/test.db");
  if (fs.existsSync(tmpDbFile)) {
    fs.unlinkSync(tmpDbFile);
  }
  return {
    connection: {
      client: "sqlite",
      connection: {
        filename: tmpDbFile,
      },
      useNullAsDefault: true,
      debug: false,
    },
  };
};
