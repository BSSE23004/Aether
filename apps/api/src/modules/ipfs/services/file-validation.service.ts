/**
 * File Validation Service
 * Validates uploaded files for security and compliance
 */

import { Injectable, Logger } from '@nestjs/common';

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
}

export interface FileValidationConfig {
  maxSize: number; // in bytes
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  maxFileNameLength: number;
  blockedPatterns: RegExp[];
}

@Injectable()
export class FileValidationService {
  private readonly logger = new Logger(FileValidationService.name);
  
  private defaultConfig: FileValidationConfig = {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'application/json',
      'text/plain',
      'text/markdown',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg'
    ],
    allowedExtensions: [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
      '.pdf', '.json', '.txt', '.md',
      '.mp4', '.webm', '.mp3', '.wav', '.ogg'
    ],
    maxFileNameLength: 255,
    blockedPatterns: [
      /\.\./, // Prevent directory traversal
      /[<>:"|?*]/, // Prevent invalid characters
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i // Prevent Windows reserved names
    ]
  };

  private configMap: Map<string, FileValidationConfig> = new Map();

  constructor() {
    this.initializeConfigs();
  }

  /**
   * Initialize validation configurations for different use cases
   */
  private initializeConfigs(): void {
    // Avatar images
    this.configMap.set('avatar', {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      maxFileNameLength: 100,
      blockedPatterns: this.defaultConfig.blockedPatterns
    });

    // Community images
    this.configMap.set('community', {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
      maxFileNameLength: 100,
      blockedPatterns: this.defaultConfig.blockedPatterns
    });

    // Message attachments
    this.configMap.set('attachment', {
      maxSize: 25 * 1024 * 1024, // 25MB
      allowedMimeTypes: [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/json',
        'text/plain', 'text/markdown'
      ],
      allowedExtensions: [
        '.jpg', '.jpeg', '.png', '.gif', '.webp',
        '.pdf', '.json', '.txt', '.md'
      ],
      maxFileNameLength: 255,
      blockedPatterns: this.defaultConfig.blockedPatterns
    });

    // Metadata files
    this.configMap.set('metadata', {
      maxSize: 1 * 1024 * 1024, // 1MB
      allowedMimeTypes: ['application/json'],
      allowedExtensions: ['.json'],
      maxFileNameLength: 100,
      blockedPatterns: this.defaultConfig.blockedPatterns
    });
  }

  /**
   * Validate file
   */
  validateFile(
    file: Express.Multer.File,
    configType: string = 'default'
  ): FileValidationResult {
    const config = this.configMap.get(configType) || this.defaultConfig;
    const errors: string[] = [];

    // Check file size
    if (file.size > config.maxSize) {
      errors.push(
        `File size ${file.size} bytes exceeds maximum allowed size of ${config.maxSize} bytes`
      );
    }

    // Check MIME type
    if (!config.allowedMimeTypes.includes(file.mimetype)) {
      errors.push(
        `MIME type ${file.mimetype} is not allowed. Allowed types: ${config.allowedMimeTypes.join(', ')}`
      );
    }

    // Check file extension
    const extension = this.getFileExtension(file.originalname);
    if (!config.allowedExtensions.includes(extension)) {
      errors.push(
        `File extension ${extension} is not allowed. Allowed extensions: ${config.allowedExtensions.join(', ')}`
      );
    }

    // Check file name length
    if (file.originalname.length > config.maxFileNameLength) {
      errors.push(
        `File name length ${file.originalname.length} exceeds maximum allowed length of ${config.maxFileNameLength}`
      );
    }

    // Check for blocked patterns
    for (const pattern of config.blockedPatterns) {
      if (pattern.test(file.originalname)) {
        errors.push(`File name contains blocked pattern`);
        break;
      }
    }

    // Validate file content (basic magic number check)
    const contentError = this.validateFileContent(file);
    if (contentError) {
      errors.push(contentError);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate file content using magic numbers
   */
  private validateFileContent(file: Express.Multer.File): string | null {
    const magicNumbers: Record<string, string[]> = {
      'image/jpeg': ['ff d8 ff'],
      'image/png': ['89 50 4e 47'],
      'image/gif': ['47 49 46 38'],
      'image/webp': ['52 49 46 46'],
      'application/pdf': ['25 50 44 46'],
      'application/json': ['7b 7d'], // Start of JSON object
      'text/plain': [], // No specific magic number
      'text/markdown': [] // No specific magic number
    };

    const expectedMagicNumbers = magicNumbers[file.mimetype];
    if (!expectedMagicNumbers || expectedMagicNumbers.length === 0) {
      return null; // Skip validation for types without magic numbers
    }

    try {
      const fileHeader = file.buffer.slice(0, 4);
      const headerHex = fileHeader.toString('hex').match(/.{1,2}/g)?.join(' ') || '';

      const isValid = expectedMagicNumbers.some(magic => 
        headerHex.startsWith(magic)
      );

      if (!isValid) {
        return `File content does not match declared MIME type ${file.mimetype}`;
      }

      return null;
    } catch (error) {
      this.logger.error('Error validating file content', error);
      return 'File content validation failed';
    }
  }

  /**
   * Get file extension
   */
  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return '';
    }
    return filename.substring(lastDotIndex).toLowerCase();
  }

  /**
   * Sanitize file name
   */
  sanitizeFileName(filename: string): string {
    // Remove directory traversal attempts
    let sanitized = filename.replace(/\.\./g, '');
    
    // Remove invalid characters
    sanitized = sanitized.replace(/[<>:"|?*]/g, '');
    
    // Remove leading/trailing spaces and dots
    sanitized = sanitized.trim().replace(/^\.+|\.+$/g, '');
    
    // Limit length
    if (sanitized.length > 255) {
      sanitized = sanitized.substring(0, 255);
    }
    
    // If empty after sanitization, use default name
    if (!sanitized) {
      sanitized = 'file';
    }
    
    return sanitized;
  }

  /**
   * Generate safe file name
   */
  generateSafeFileName(originalName: string, prefix?: string): string {
    const sanitized = this.sanitizeFileName(originalName);
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    
    const extension = this.getFileExtension(sanitized);
    const baseName = sanitized.substring(0, sanitized.length - extension.length);
    
    const prefixStr = prefix ? `${prefix}_` : '';
    return `${prefixStr}${baseName}_${timestamp}_${randomString}${extension}`;
  }

  /**
   * Validate multiple files
   */
  validateFiles(
    files: Express.Multer.File[],
    configType: string = 'default'
  ): FileValidationResult[] {
    return files.map(file => this.validateFile(file, configType));
  }

  /**
   * Get configuration for a specific type
   */
  getConfig(configType: string): FileValidationConfig {
    return this.configMap.get(configType) || this.defaultConfig;
  }

  /**
   * Add custom configuration
   */
  addConfig(name: string, config: FileValidationConfig): void {
    this.configMap.set(name, config);
    this.logger.log(`Added custom validation configuration: ${name}`);
  }
}