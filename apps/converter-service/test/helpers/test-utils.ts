import { Connection } from 'mongoose';

export const cleanDatabase = async (connection: Connection) => {
  if (connection && connection.db) {
    await connection.db.dropDatabase();
  }
};
