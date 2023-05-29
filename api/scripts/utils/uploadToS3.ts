import config from 'config';
import { S3Client, PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';
import path from 'path';

const client = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: config.get('s3.accessKeyId'),
    secretAccessKey: config.get('s3.secretAccessKey'),
  },
});

type ExtType = '.png' | '.mp4' | '.gif' | '.json';

const mimeTypes = {
  '.png': 'image/png',
  '.mp4': 'video/mp4',
  '.gif': 'image/gif',
  '.json': 'application/json',
};

export const uploadToS3 = async (
  fileName: string,
  content: PutObjectCommandInput['Body'],
  retry = true,
  baseDirectory = '',
) => {
  const params = {
    Bucket: config.get('s3.bucket'),
    Key: `${baseDirectory}/${fileName}`,
    Body: content,
    ContentType: mimeTypes[path.extname(fileName) as ExtType] || 'application/json',
    ACL: 'public-read',
  } as PutObjectCommandInput;

  try {
    const command = new PutObjectCommand(params);
    const response = await client.send(command);
    console.log(response);
  } catch (err) {
    console.error(err);
    if (retry) uploadToS3(fileName, content, false, baseDirectory);
  }
};
