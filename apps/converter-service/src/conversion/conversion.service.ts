import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, mongo } from 'mongoose';
import ffmpeg from 'fluent-ffmpeg';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class ConversionService {
  private readonly logger = new Logger(ConversionService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
  ) {}

  async convertVideo(fileId: string, filename: string): Promise<void> {
    this.logger.log(`Starting conversion for file: ${filename} (${fileId})`);

    if (!this.connection.db) {
      throw new Error('Database connection not established');
    }

    const bucket = new mongo.GridFSBucket(this.connection.db, {
      bucketName: 'videos',
    });

    const downloadStream = bucket.openDownloadStream(
      new mongo.ObjectId(fileId),
    );
    const uploadStream = bucket.openUploadStream(`converted-${filename}.mp3`);

    return new Promise((resolve, reject) => {
      ffmpeg(downloadStream)
        .toFormat('mp3')
        .on('error', (err) => {
          this.logger.error(`Error converting file ${filename}:`, err);
          reject(err);
        })
        .on('end', () => {
          this.logger.log(`Conversion completed for file: ${filename}`);
          this.notificationClient.emit('conversion_completed', {
            fileId,
            filename,
            status: 'completed',
          });
          resolve();
        })
        .pipe(uploadStream);
    });
  }

  async downloadFile(filename: string): Promise<mongo.GridFSBucketReadStream> {
    if (!this.connection.db) {
      throw new Error('Database connection not established');
    }

    const bucket = new mongo.GridFSBucket(this.connection.db, {
      bucketName: 'videos',
    });

    // We need to find the file first to get its ID or just open by name if unique.
    // Given the upload logic: `converted-${filename}.mp3`
    // Let's assume we are passed the original filename or the converted filename.
    // The plan said /download/:fileId, but the upload logic stores `converted-filename.mp3`.
    // If we use fileId, we need to know the ID of the *converted* file.
    // For simplicity in this phase, let's assume we download by filename for now,
    // or we need to look up the converted file.
    // However, the prompt says "Use the fileId from the notification/logs".
    // The notification sends { fileId, filename, status }.
    // That fileId is the *original* video file ID.
    // The converted file is stored as `converted-${filename}.mp3`.
    // So we should probably look up the file by filename `converted-${filename}.mp3`.

    const cursor = bucket.find({ filename: `converted-${filename}.mp3` });
    const files = await cursor.toArray();

    if (files.length === 0) {
      throw new Error('File not found');
    }

    return bucket.openDownloadStream(files[0]._id);
  }
}
