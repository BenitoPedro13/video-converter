import { Test, TestingModule } from '@nestjs/testing';
import { UploadController } from './upload.controller';
import { UploadService, GridFsFile } from './upload.service';

describe('UploadController', () => {
  let controller: UploadController;

  const mockUploadService = {
    handleFileUpload: jest.fn(),
  };

  beforeEach(async () => {
    const testingModule: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
      ],
    }).compile();

    controller = testingModule.get<UploadController>(UploadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should call service.handleFileUpload with the file', () => {
      const mockFile = {
        id: '507f1f77bcf86cd799439011',
        filename: 'test-video.mp4',
      } as GridFsFile;

      const expectedResult = {
        message: 'File uploaded successfully',
        fileId: mockFile.id,
        filename: mockFile.filename,
      };

      mockUploadService.handleFileUpload.mockReturnValue(expectedResult);

      const result = controller.uploadFile(mockFile);

      expect(mockUploadService.handleFileUpload).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual(expectedResult);
    });
  });
});
