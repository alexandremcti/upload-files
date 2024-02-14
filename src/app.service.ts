import { Readable } from 'node:stream';
import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async upload(params: UploadInputDTO): Promise<UploadOutputDTO> {
    const { buffer, filename, size } = params;
    const readableStream = Readable.from(buffer);

    const s3 = new S3Client({
      endpoint: 'http://0.0.0.0:4566',
      region: 'us-east-1',
    });

    const input = {
      Bucket: 'filemanager-storage',
      Key: filename,
    };

    const createMultipartUploadCommand = new CreateMultipartUploadCommand(
      input,
    );

    Logger.log('Enviando commando de create multipart upload');
    const createMultipartUploadCommandResponse = await s3.send(
      createMultipartUploadCommand,
    );
    Logger.log('create multipart upload command response');
    Logger.log(createMultipartUploadCommandResponse);

    const { Bucket, Key, UploadId } = createMultipartUploadCommandResponse;

    const uploadCommand = new UploadPartCommand({
      Body: readableStream,
      Bucket,
      Key,
      UploadId,
      PartNumber: 1,
    });

    Logger.log('Enviando comando upload part');
    const uploadCommandResponse = await s3.send(uploadCommand);

    Logger.log('create multipart upload command response');
    Logger.log(uploadCommandResponse);

    const { ETag } = uploadCommandResponse;

    const completeMultipartUploadCommand = new CompleteMultipartUploadCommand({
      Bucket,
      Key,
      MultipartUpload: {
        Parts: [
          {
            ETag,
            PartNumber: 1,
          },
        ],
      },
      UploadId,
    });

    Logger.log('Enviando commando complete multipart upload');
    const completeMultipartUploadCommandResponse = await s3.send(
      completeMultipartUploadCommand,
    );

    Logger.log('Complete Multpart Upload Response');
    Logger.log(completeMultipartUploadCommandResponse);

    return {
      createdAt: new Date(),
      filename: params.filename,
    };
  }
}

export type UploadInputDTO = {
  filename: string;
  buffer: Buffer;
  size: number;
};

export type UploadOutputDTO = {
  filename: string;
  createdAt: Date;
};
