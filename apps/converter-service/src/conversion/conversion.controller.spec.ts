import { Test, TestingModule } from '@nestjs/testing';
import { Type } from '@nestjs/common';
import { ConversionController } from './conversion.controller';
import { ConversionService } from './conversion.service';

describe('ConversionController', () => {
  let controller: ConversionController;

  const mockConversionService = {
    convertVideo: jest.fn(),
  };

  beforeEach(async () => {
    const testingModule: TestingModule = await Test.createTestingModule({
      controllers: [ConversionController],
      providers: [
        {
          provide: ConversionService,
          useValue: mockConversionService,
        },
      ],
    }).compile();

    controller = testingModule.get<ConversionController>(
      ConversionController as unknown as Type<ConversionController>,
    ) as unknown as ConversionController;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleVideoUploaded', () => {
    it('should call conversionService.convertVideo with correct parameters', async () => {
      const payload = {
        fileId: 'test-file-id',
        filename: 'test-video.mp4',
      };

      await controller.handleVideoUploaded(payload);

      expect(mockConversionService.convertVideo).toHaveBeenCalledWith(
        payload.fileId,
        payload.filename,
      );
    });
  });
});
