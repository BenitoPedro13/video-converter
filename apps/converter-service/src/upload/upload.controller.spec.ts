import { Test, TestingModule } from '@nestjs/testing';
import { UploadController } from './upload.controller';
import { UploadService, GridFsFile } from './upload.service';

describe('UploadController', () => {
  let controller: UploadController;
  let service: UploadService;

  const mockUploadService = {
    handleFileUpload: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
      ],
    }).compile();

    controller = module.get<UploadController>(UploadController);
    service = module.get<UploadService>(UploadService);
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

      expect(service.handleFileUpload.bind(service)).toHaveBeenCalledWith(
        mockFile,
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
