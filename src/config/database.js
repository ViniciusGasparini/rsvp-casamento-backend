import mongoose from "mongoose";

export const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || "rsvp_casamento";

  if (!uri) {
    throw new Error("A variável MONGODB_URI não foi configurada.");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    dbName,
    serverSelectionTimeoutMS: 15000,
    maxPoolSize: 10,
    minPoolSize: 0,
  });

  console.log(`MongoDB conectado ao banco ${dbName}.`);
};

export const disconnectDatabase = async () => {
  await mongoose.disconnect();
};
