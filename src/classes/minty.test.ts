import { CID } from 'multiformats/cid';
import { beforeEach, describe, expect, it, mock, test } from 'bun:test';

const mockAdd = mock<() => Promise<any>>();
const mockCat = mock();
const mockPinAdd = mock<() => Promise<any>>();
const mockPinRm = mock<() => Promise<any>>();
const mockPinLs = mock();
const mockFetch = mock<() => Promise<any>>();

const mockCreate = mock().mockReturnValue({
  add: mockAdd,
  cat: mockCat,
  pin: { add: mockPinAdd, rm: mockPinRm, ls: mockPinLs },
});

mock.module('kubo-rpc-client', () => ({
  create: mockCreate,
}));

mock.module('node-config-ts', () => ({
  config: {
    ipfs: {
      protocol: 'https',
      host: 'api.ipfs.io',
      port: 5001,
      path: '',
      authorization: 'Bearer test-token',
      pinata: { pinataApiKey: 'test-key', pinataSecretApiKey: 'test-secret' },
    },
  },
}));

mock.module('node-fetch', () => ({
  default: mockFetch,
}));

mock.module('@/contracts', () => ({
  getContractFactory: mock<() => Promise<null>>().mockResolvedValue(null),
}));

mock.module('@/utils/refreshMetadata', () => ({
  refreshOpenSea: mock(),
}));

mock.module('@/utils/uploadToS3', () => ({
  uploadToS3: mock(),
}));

const SAMPLE_CID = 'bafybeih75ntopwuggljajz3p2y2mh2ylxfv6joqlbvo2wxtabxkxm6igaa';

const { Minty } = await import('./minty');

function makeMinty() {
  return new Minty('mainnet', 'NiftyDegen');
}

beforeEach(() => {
  (mockAdd.mockClear(),
    mockCat.mockClear(),
    mockPinAdd.mockClear(),
    mockPinRm.mockClear(),
    mockPinLs.mockClear(),
    mockFetch.mockClear(),
    mockCreate.mockClear());

  mockAdd.mockClear();
  mockCat.mockClear();
  mockPinAdd.mockClear();
  mockPinRm.mockClear();
  mockPinLs.mockClear();
  mockFetch.mockClear();
});

describe('Minty.init', () => {
  it('creates an IPFS client via kubo-rpc-client', async () => {
    const minty = makeMinty();
    await minty.init();
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(minty.ipfs).toBeTruthy();
  });

  it('is idempotent', async () => {
    const minty = makeMinty();
    await minty.init();
    await minty.init();
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});

describe('Minty.pinImage', () => {
  it('uploads to IPFS and pins on Pinata via REST API', async () => {
    const minty = makeMinty();
    await minty.init();

    const cid = CID.parse(SAMPLE_CID);
    mockAdd.mockResolvedValue({ cid, size: 1234 });
    mockFetch.mockResolvedValue({ ok: true, status: 200, text: async () => 'OK' });

    const content = Buffer.from('fake image data');
    const result = await minty.pinImage('/degens/1.png', content);

    expect(mockAdd).toHaveBeenCalledTimes(1);
    expect(result.assetCid).toBe(cid);
    expect(result.assetURI).toContain(SAMPLE_CID);
    expect(result.assetURI).toContain('/degens/1.png');

    // Pinata REST call
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const call = mockFetch.mock.calls[0] as unknown as [string, any];
    expect(call[0]).toBe('https://api.pinata.cloud/pinning/pinByHash');
    expect(call[1].method).toBe('POST');
    const body = JSON.parse(call[1].body);
    expect(body.hashToPin).toBe(SAMPLE_CID);
    expect(body.pinataMetadata.name).toBe('/degens/1.png');
  });

  it('returns empty result when IPFS client is not initialized', async () => {
    const minty = makeMinty();
    // Don't call init()
    const result = await minty.pinImage('/degens/1.png', Buffer.from('data'));
    expect(result.assetURI).toBe('');
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it('continues when Pinata pinByHash fails', async () => {
    const minty = makeMinty();
    await minty.init();

    const cid = CID.parse(SAMPLE_CID);
    mockAdd.mockResolvedValue({ cid, size: 1234 });
    mockFetch.mockResolvedValue({ ok: false, status: 403, text: async () => 'Forbidden' });

    const result = await minty.pinImage('/degens/1.png', Buffer.from('data'));
    expect(result.assetCid).toBe(cid);
    expect(result.assetURI).toContain(SAMPLE_CID);
  });
});

describe('Minty.getIPFS / getIPFSString / getIPFSJSON', () => {
  it('reads content from IPFS via cat()', async () => {
    const minty = makeMinty();
    await minty.init();

    const data = new TextEncoder().encode('hello ipfs');
    mockCat.mockReturnValue(
      (async function* () {
        yield data;
      })(),
    );

    const bytes = await minty.getIPFS(SAMPLE_CID);
    expect(bytes).toBeDefined();
    expect(new TextDecoder().decode(bytes!)).toBe('hello ipfs');
  });

  it('returns content as a string', async () => {
    const minty = makeMinty();
    await minty.init();

    const data = new TextEncoder().encode('{"name":"test"}');
    mockCat.mockReturnValue(
      (async function* () {
        yield data;
      })(),
    );

    const str = await minty.getIPFSString(SAMPLE_CID);
    expect(str).toBe('{"name":"test"}');
  });

  it('parses JSON content', async () => {
    const minty = makeMinty();
    await minty.init();

    const data = new TextEncoder().encode('{"name":"test"}');
    mockCat.mockReturnValue(
      (async function* () {
        yield data;
      })(),
    );

    const json = await minty.getIPFSJSON(`ipfs://${SAMPLE_CID}`);
    expect(json).toEqual({ name: 'test' });
  });
});

describe('Minty.pin / unpin / isPinned', () => {
  it('pins a CID on the IPFS node', async () => {
    const minty = makeMinty();
    await minty.init();

    mockPinLs.mockReturnValue((async function* () {})());
    mockPinAdd.mockResolvedValue(SAMPLE_CID);

    await minty.pin(SAMPLE_CID);
    expect(mockPinAdd).toHaveBeenCalledTimes(1);
  });

  it('skips pinning if already pinned', async () => {
    const minty = makeMinty();
    await minty.init();

    // isPinned returns a result → already pinned
    mockPinLs.mockReturnValue(
      (async function* () {
        yield { cid: CID.parse(SAMPLE_CID), type: 'recursive' };
      })(),
    );

    await minty.pin(SAMPLE_CID);
    expect(mockPinAdd).not.toHaveBeenCalled();
  });

  it('unpins a CID', async () => {
    const minty = makeMinty();
    await minty.init();

    mockPinLs.mockReturnValue(
      (async function* () {
        yield { cid: CID.parse(SAMPLE_CID), type: 'recursive' };
      })(),
    );
    mockPinRm.mockResolvedValue(SAMPLE_CID);

    await minty.unpin(SAMPLE_CID);
    expect(mockPinRm).toHaveBeenCalledTimes(1);
  });

  it('detects a pinned CID', async () => {
    const minty = makeMinty();
    await minty.init();

    mockPinLs.mockReturnValue(
      (async function* () {
        yield { cid: CID.parse(SAMPLE_CID), type: 'recursive' };
      })(),
    );

    expect(await minty.isPinned(SAMPLE_CID)).toBe(true);
  });

  it('returns false for an unpinned CID', async () => {
    const minty = makeMinty();
    await minty.init();

    mockPinLs.mockReturnValue((async function* () {})());

    expect(await minty.isPinned(SAMPLE_CID)).toBe(false);
  });
});
