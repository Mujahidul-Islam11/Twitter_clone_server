const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({path: "../.env"});

const connectDB = async () => {
    try {
      const conn = await mongoose.connect(process.env.MongoDbURI);
      console.log(`MongoDB Connected`);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  }

module.exports = connectDB;