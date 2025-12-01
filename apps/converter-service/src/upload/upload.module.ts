import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
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
    ClientsModule.registerAsync([
      {
        name: 'VIDEO_CONVERSION_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('RABBITMQ_URI')],
            queue: 'video_conversion_queue',
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
