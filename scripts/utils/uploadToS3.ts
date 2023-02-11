import config from 'config';
import AWS from 'aws-sdk';
import path from 'path';

const s3 = new AWS.S3({
  accessKeyId: config.get('s3.accessKeyId'),
  secretAccessKey: config.get('s3.secretAccessKey'),
});

type ExtType = '.png' | '.mp4' | '.json';

const mimeTypes = {
  '.png': 'image/png',
  '.mp4': 'video/mp4',
  '.json': 'application/json',
};

export const uploadToS3 = async (fileName: string, content: AWS.S3.Body, retry = true, baseDirectory = '') => {
  const params = {
    Bucket: config.get('s3.bucket'),
    Key: `${baseDirectory}/${fileName}`,
    Body: content,
    ContentType: mimeTypes[path.extname(fileName) as ExtType] || 'application/json',
    ACL: 'public-read',
  } as AWS.S3.PutObjectRequest;
  try {
    return s3.upload(params).promise();
  } catch (err) {
    console.log(err);
    if (retry) uploadToS3(fileName, content, false, baseDirectory);
  }
};
