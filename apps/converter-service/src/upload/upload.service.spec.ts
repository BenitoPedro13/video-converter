import { Test, TestingModule } from '@nestjs/testing';
import { UploadService, GridFsFile } from './upload.service';
import { BadRequestException } from '@nestjs/common';

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadService],
    }).compile();

    service = module.get<UploadService>(UploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleFileUpload', () => {
    it('should return file info when file is provided', () => {
      const mockFile = {
        id: '507f1f77bcf86cd799439011',
        filename: 'test-video.mp4',
        originalname: 'test-video.mp4',
      } as GridFsFile;

      const result = service.handleFileUpload(mockFile);

      expect(result).toEqual({
        message: 'File uploaded successfully',
        fileId: mockFile.id,
        filename: mockFile.filename,
      });
    });

    it('should throw BadRequestException when file is not provided', () => {
      expect(() =>
        service.handleFileUpload(null as unknown as GridFsFile),
      ).toThrow(BadRequestException);
      expect(() =>
        service.handleFileUpload(undefined as unknown as GridFsFile),
      ).toThrow(BadRequestException);
    });
  });
});
