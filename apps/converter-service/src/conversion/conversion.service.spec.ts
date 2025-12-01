import { Test, TestingModule } from '@nestjs/testing';
import { ConversionService } from './conversion.service';
import { getConnectionToken } from '@nestjs/mongoose';
import { mongo } from 'mongoose';
import * as ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from 'stream';
import { Type } from '@nestjs/common';

// Mock fluent-ffmpeg
jest.mock('fluent-ffmpeg');

describe('ConversionService', () => {
  let service: ConversionService;

  const mockDb = {
    collection: jest.fn(),
  };

  const mockConnection = {
    db: mockDb,
  };

  beforeEach(async () => {
    const testingModule: TestingModule = await Test.createTestingModule({
      providers: [
        ConversionService,
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
      ],
    }).compile();

    service = testingModule.get<ConversionService>(
      ConversionService as unknown as Type<ConversionService>,
    ) as unknown as ConversionService;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('convertVideo', () => {
    it('should convert video to mp3', async () => {
      const fileId = '507f1f77bcf86cd799439011';
      const filename = 'test-video.mp4';

      const mockReadStream = new PassThrough();
      const mockWriteStream = new PassThrough();

      const mockBucket = {
        openDownloadStream: jest.fn().mockReturnValue(mockReadStream),
        openUploadStream: jest.fn().mockReturnValue(mockWriteStream),
      };

      // Mock GridFSBucket constructor
      jest
        .spyOn(mongo, 'GridFSBucket')
        .mockReturnValue(mockBucket as unknown as mongo.GridFSBucket);

      // Mock ffmpeg
      const mockFfmpegCommand = {
        toFormat: jest.fn().mockReturnThis(),
        on: jest
          .fn()
          .mockImplementation((event: string, callback: () => void) => {
            if (event === 'end') {
              callback();
            }
            return mockFfmpegCommand;
          }),
        pipe: jest.fn().mockImplementation((stream: unknown) => {
          // Simulate piping to write stream
          return stream;
        }),
      };

      (ffmpeg as unknown as jest.Mock).mockReturnValue(mockFfmpegCommand);

      await service.convertVideo(fileId, filename);

      expect(mongo.GridFSBucket).toHaveBeenCalledWith(mockDb, {
        bucketName: 'videos',
      });
      expect(mockBucket.openDownloadStream).toHaveBeenCalled();
      expect(ffmpeg).toHaveBeenCalled();
      expect(mockFfmpegCommand.toFormat).toHaveBeenCalledWith('mp3');
      expect(mockFfmpegCommand.pipe).toHaveBeenCalled();
    });
  });
});
