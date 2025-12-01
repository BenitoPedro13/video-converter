import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { getGridFsConfig } from './gridfs.config';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: getGridFsConfig,
      inject: [ConfigService, getConnectionToken()],
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
