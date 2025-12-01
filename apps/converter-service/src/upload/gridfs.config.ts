import { ConfigService } from '@nestjs/config';
import { MulterModuleOptions } from '@nestjs/platform-express';
import { GridFsStorage } from 'multer-gridfs-storage';
import { Connection } from 'mongoose';

export const getGridFsConfig = (
  configService: ConfigService,
  connection: Connection,
): MulterModuleOptions => {
  if (!connection.db) {
    throw new Error('Database connection not established');
  }

  const storage = new GridFsStorage({
    db: connection.db,
    file: (_req, file: Express.Multer.File) => {
      return new Promise((resolve) => {
        const filename = `${Date.now()}-${file.originalname}`;
        const fileInfo = {
          filename: filename,
          bucketName: 'videos',
        };
        resolve(fileInfo);
      });
    },
  });

  return {
    storage,
  };
};
