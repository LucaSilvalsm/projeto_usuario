require('dotenv').config();

module.exports = {
  development: {
    client: process.env.DB_DIALECT,

    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },

    migrations: {
      directory: './database/migrations',
    },
  },
};