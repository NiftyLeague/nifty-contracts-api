import { beforeEach, describe, expect, it, vi } from 'vitest';

const { commandMock, sendMock } = vi.hoisted(() => ({
  commandMock: vi.fn(),
  sendMock: vi.fn(),
}));

vi.mock('node-config-ts', () => ({
  config: {
    aws: {
      s3: { bucket: 'assets-bucket', clientConfig: { region: 'us-east-1' } },
    },
  },
}));
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {
    send = sendMock;
  },
  PutObjectCommand: class {
    constructor(params: unknown) {
      commandMock(params);
    }
  },
}));

import { uploadToS3 } from './uploadToS3';

beforeEach(() => {
  commandMock.mockReset();
  sendMock.mockReset();
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('uploadToS3', () => {
  it('uploads image content with its MIME type and base directory', async () => {
    sendMock.mockResolvedValue({ $metadata: { httpStatusCode: 200 } });

    await uploadToS3('character.png', Buffer.from('image'), true, 'mainnet/images');

    expect(commandMock).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: 'assets-bucket',
        Key: 'mainnet/images/character.png',
        ContentType: 'image/png',
        ACL: 'public-read',
      }),
    );
  });

  it('defaults unknown extensions to JSON', async () => {
    sendMock.mockResolvedValue({ $metadata: { httpStatusCode: 200 } });

    await uploadToS3('metadata.unknown', '{}', false);

    expect(commandMock).toHaveBeenCalledWith(
      expect.objectContaining({ Key: '/metadata.unknown', ContentType: 'application/json' }),
    );
  });

  it('retries one failed upload and then stops', async () => {
    sendMock
      .mockResolvedValueOnce({ $metadata: { httpStatusCode: 503 } })
      .mockResolvedValueOnce({ $metadata: { httpStatusCode: 200 } });

    await uploadToS3('metadata.json', '{}');
    await vi.waitFor(() => expect(sendMock).toHaveBeenCalledTimes(2));
  });

  it('does not retry when retry is disabled', async () => {
    sendMock.mockRejectedValue(new Error('network unavailable'));

    await uploadToS3('metadata.json', '{}', false);

    expect(sendMock).toHaveBeenCalledTimes(1);
  });
});
