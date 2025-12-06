import request from 'supertest';
import { jest } from '@jest/globals';

import { DEFAULTS, getEndpoints } from './constants/api';
import { ITEMS_METADATA } from './constants/metadata/items';
import { MARKETPLACE_COLLECTION_METADATA } from './constants/metadata/marketplace';
import { getItemIdByTokenId_SAFE } from './utils/getItemIdByTokenId';
import { handleNameChangeById } from './utils/handleNameChange';
import { MakeDegen, Degen } from './classes/degen';
import app from './index';

describe('API Endpoints', () => {
  it('should return the API details on the root endpoint', async () => {
    const response = await request(app).get('/');
    const baseUrl = `${response.request.protocol}//${response.request.host}`;
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ...DEFAULTS,
      endpoints: getEndpoints(baseUrl),
    });
  });

  describe('NFTL', () => {
    const NFTL_MIN_SUPPLY = 500000000000000000000000000n;

    it('should return the circulating supply of NFTL', async () => {
      const response = await request(app).get('/NFTL/supply/circulating');
      expect(response.status).toBe(200);
      expect(BigInt(response.text)).toBeGreaterThan(NFTL_MIN_SUPPLY);
    });

    it('should return the unclaimed supply of NFTL', async () => {
      const response = await request(app).get('/NFTL/supply/unclaimed');
      expect(response.status).toBe(200);
      expect(response.text).toBeDefined();
    }, 30000);

    it('should return the total supply of NFTL', async () => {
      const response = await request(app).get('/NFTL/supply/total');
      expect(response.status).toBe(200);
      expect(BigInt(response.text)).toBeGreaterThan(NFTL_MIN_SUPPLY);
    }, 30000);

    it('should return the max supply of NFTL', async () => {
      const response = await request(app).get('/NFTL/supply/max');
      expect(response.status).toBe(200);
      expect(BigInt(response.text)).toBeGreaterThan(NFTL_MIN_SUPPLY);
    }, 30000);
  });

  describe('DEGENs', () => {
    const network = 'sepolia';
    const tokenId = 123;

    it('should return the burned degens list', async () => {
      const response = await request(app).get('/degens/burn-list');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(800);
      // Add a delay to ensure async operations are completed before the test ends
      await new Promise(resolve => setTimeout(resolve, 1000));
    }, 20000);

    it('should return the metadata of a degen by token ID', async () => {
      const response = await request(app).get(`/${network}/degen/metadata/${tokenId}`);
      expect(response.status).toBe(200);
      expect(response.body.name).toEqual(`DEGEN #${tokenId}`);
    });

    it('should return the image of a degen by token ID', async () => {
      const response = await request(app).get(`/${network}/degen/image/${tokenId}`);
      expect(response.status).toBe(200);
      expect(response.header['content-type']).toMatch(/image\/(png|gif)/);
    });

    it('should return the background attribute', async () => {
      const response = await request(app).get(`/${network}/degen/${tokenId}/background`);
      expect(response.status).toBe(200);
      expect(response.text).toMatch('Common');
    });
  });

  describe('MARKETPLACE', () => {
    const comicId = 2;
    const itemId = 101;

    it('should return the collection metadata of the marketplace', async () => {
      const response = await request(app).get('/imx/marketplace/collection.json');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(MARKETPLACE_COLLECTION_METADATA);
    });

    it('should return the metadata of a comic by token ID', async () => {
      const response = await request(app).get(`/imx/marketplace/metadata/${comicId}`);
      expect(response.status).toBe(200);
      expect(response.body.name).toEqual(`Comic #${comicId}`);
    });

    it('should return the image of a comic by token ID', async () => {
      const response = await request(app).get(`/imx/marketplace/images/${comicId}`);
      expect(response.status).toBe(200);
      expect(response.header['content-type']).toMatch(/image\/png/);
    });

    it('should return the metadata of an item by token ID', async () => {
      const response = await request(app).get(`/imx/marketplace/metadata/${itemId}`);
      expect(response.status).toBe(200);
      expect(response.body.name).toEqual(ITEMS_METADATA[itemId - 100 - 1].name);
    });

    it('should return the image of an item by token ID', async () => {
      const response = await request(app).get(`/imx/marketplace/images/${itemId}`);
      expect(response.status).toBe(200);
      expect(response.header['content-type']).toMatch(/image\/gif/);
    });
  });

  xdescribe('SNAPSHOTS', () => {
    it('should return a snapshot list for comics', async () => {
      const response = await request(app).get(`/imx/snapshot/comics`);
      expect(response.status).toBe(200);
    });

    it('should return a snapshot list for items', async () => {
      const response = await request(app).get(`/imx/snapshot/items`);
      expect(response.status).toBe(200);
    });
  });

  xdescribe('COMICS', () => {
    const tokenId = 2;

    it('should return the metadata of a comic by token ID', async () => {
      const response = await request(app).get(`/imx/comics/metadata/${tokenId}`);
      expect(response.status).toBe(200);
      expect(response.body.name).toEqual(`COMIC #${tokenId}`);
    });

    it('should return the image of a comic by token ID', async () => {
      const response = await request(app).get(`/imx/comics/image/${tokenId}`);
      expect(response.status).toBe(200);
      expect(response.header['content-type']).toMatch(/image\/(png|gif)/);
    });
  });

  xdescribe('ITEMS', () => {
    const tokenId = 10;

    it('should return the metadata of an item by token ID', async () => {
      const response = await request(app).get(`/imx/items/metadata/${tokenId}`);
      expect(response.status).toBe(200);
      const itemId = await getItemIdByTokenId_SAFE(tokenId.toString());
      expect(response.body.name).toEqual(ITEMS_METADATA[`${itemId - 1n}`].name);
    });

    it('should return the image of an item by token ID', async () => {
      const response = await request(app).get(`/imx/items/image/${tokenId}`);
      expect(response.status).toBe(200);
      expect(response.header['content-type']).toMatch(/image\/gif/);
    });

    it('should return a paginated list of items', async () => {
      const response = await request(app).get('/imx/items');
      expect(response.status).toBe(200);
      expect(response.body.result).toHaveLength(200);
      expect(response.body.cursor).toBeDefined();
    });

    it('should return an empty list of null items', async () => {
      const response = await request(app).get('/imx/null-items');
      expect(response.status).toBe(200);
      expect(response.body.total).toEqual(0);
    });

    it('should return an full overview of items stats', async () => {
      const response = await request(app).get('/imx/items/overview');
      expect(response.status).toBe(200);

      expect(BigInt(response.body.total_items)).toBeGreaterThan(200);
      expect(BigInt(response.body.total_holders)).toBeGreaterThanOrEqual(3);
      expect(BigInt(response.body.key_holders)).toBeGreaterThanOrEqual(3);

      expect(response.body.item_balances).toBeDefined();
      expect(response.body.holder_balances).toBeDefined();
      expect(response.body.holder_key_balances).toBeDefined();
    });
  });
});

jest.mock('./classes/degen');

describe('API Webhooks', () => {
  describe('DEGENS', () => {
    const network = 'sepolia';
    const tokenId = 1;

    const metadata = {
      id: tokenId,
      token_id: tokenId.toString(),
      name: 'Old Name',
      image: `ipfs://bafybeih75ntopwuggljajz3p2y2mh2ylxfv6joqlbvo2wxtabxkxm6igaa/degens/${tokenId}.png`,
      description: 'Original collection of your favorite 10k DEGENs 🎮',
      external_url: `https://staging.app.niftyleague.com/degens/${tokenId}`,
      attributes: [],
    };
    const newMetadata = { ...metadata };
    newMetadata.name = 'New Name';

    beforeEach(() => {
      jest.clearAllMocks();
      // Disable console.log within scripts
      jest.spyOn(console, 'log').mockImplementation(jest.fn());
    });

    it('should update the metadata on name change', async () => {
      const degenInstance = await MakeDegen(network);
      jest
        .spyOn(Degen.prototype, 'checkTokenMetadataExists')
        .mockResolvedValueOnce({ exists: true, metadata, metadataURI: null });
      jest.spyOn(Degen.prototype, 'updateDegenName').mockResolvedValueOnce({ newMetadata });

      const result = await handleNameChangeById(network, tokenId);

      expect(degenInstance.checkTokenMetadataExists).toHaveBeenCalledWith(tokenId);
      expect(degenInstance.updateDegenName).toHaveBeenCalledWith(tokenId, metadata);
      expect(result).toEqual({ metadata: newMetadata });

      // Add a delay to ensure async operations are completed before the test ends
      await new Promise(resolve => setTimeout(resolve, 1000));
    });
  });
});
