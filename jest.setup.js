require("dotenv").config();
const { connectRedis, redisClient } = require("./cache");

beforeAll(async () => {
  if (!redisClient.isOpen) await connectRedis();
});

afterAll(async () => {
  if (redisClient.isOpen) await redisClient.quit();
});
