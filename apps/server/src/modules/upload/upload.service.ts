import { Injectable, BadRequestException } from '@nestjs/common';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const UPLOAD_DIR = join(__dirname, '..', '..', '..', 'uploads');
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class UploadService {
  constructor() {
    // 确保上传目录存在
    if (!existsSync(UPLOAD_DIR)) {
      mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }

  /**
   * 处理单个文件上传
   */
  handleUpload(file: Express.Multer.File) {
    this.validateFile(file);
    return {
      url: `/uploads/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
    };
  }

  /**
   * 处理多个文件上传
   */
  handleMultipleUploads(files: Express.Multer.File[]) {
    return files.map((file) => {
      this.validateFile(file);
      return {
        url: `/uploads/${file.filename}`,
        originalName: file.originalname,
        size: file.size,
      };
    });
  }

  private validateFile(file: Express.Multer.File) {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `不支持的文件类型: ${file.mimetype}，仅支持 JPEG/PNG/WebP`,
      );
    }
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('文件大小不能超过 5MB');
    }
  }
}
