// apps/backend/src/common/upload-validator.ts
// Phase 1.1: 上传安全加固 — Magic Number 验证 + 白名单
// 仅靠 mimetype 不可靠（可被伪造），必须验证文件头魔数

import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';

/** 允许的文件类型及其魔数签名 */
const ALLOWED_SIGNATURES: Record<string, { offset: number; bytes: number[] }[]> = {
  // JPEG: FF D8 FF (多种变体)
  jpeg: [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  png: [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  // GIF: 47 49 46 38 (GIF8)
  gif: [{ offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }],
  // WebP: 52 49 46 46 .... 57 45 42 50 (RIFF....WEBP)
  webp: [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
    { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
  ],
  // PDF: 25 50 44 46 (%PDF)
  pdf: [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }],
};

/** 扩展名 → 魔数验证器映射 */
const EXTENSION_TO_TYPE: Record<string, string> = {
  '.jpg': 'jpeg',
  '.jpeg': 'jpeg',
  '.png': 'png',
  '.gif': 'gif',
  '.webp': 'webp',
  '.pdf': 'pdf',
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * 验证文件魔数是否匹配其扩展名
 * @param filePath 上传后的文件路径
 * @param originalName 原始文件名（用于获取扩展名）
 * @param fileSize 文件大小（字节）
 * @throws BadRequestException 文件类型不合法或大小超限
 */
export function validateFileMagic(filePath: string, originalName: string, fileSize: number): void {
  // 大小检查
  if (fileSize > MAX_FILE_SIZE) {
    throw new BadRequestException(`文件大小不能超过 5MB，当前: ${(fileSize / 1024 / 1024).toFixed(1)}MB`);
  }

  if (fileSize === 0) {
    throw new BadRequestException('文件为空');
  }

  // 扩展名检查
  const ext = originalName.toLowerCase().slice(originalName.lastIndexOf('.'));
  const typeKey = EXTENSION_TO_TYPE[ext];
  if (!typeKey) {
    throw new BadRequestException(`不支持的文件类型: ${ext}。支持: jpg, jpeg, png, gif, webp, pdf`);
  }

  // 魔数验证
  const signatures = ALLOWED_SIGNATURES[typeKey];
  if (!signatures) {
    throw new BadRequestException(`不支持的文件类型: ${typeKey}`);
  }

  const buffer = fs.readFileSync(filePath);
  const maxOffset = Math.max(...signatures.map((s) => s.offset + s.bytes.length));

  if (buffer.length < maxOffset) {
    throw new BadRequestException('文件内容不完整，无法验证');
  }

  for (const sig of signatures) {
    for (let i = 0; i < sig.bytes.length; i++) {
      if (buffer[sig.offset + i] !== sig.bytes[i]) {
        throw new BadRequestException(
          `文件类型验证失败: 扩展名为 ${ext} 但文件内容不匹配。请上传有效的 ${typeKey.toUpperCase()} 文件`,
        );
      }
    }
  }
}
