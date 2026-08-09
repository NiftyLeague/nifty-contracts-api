import { describe, expect, it, mock } from 'bun:test'

const mockFetch = mock<() => Promise<any>>()

mock.module('node-config-ts', () => ({
  config: {
    imageGenerator: {
      baseURL: 'https://images.example/generate',
      secret: 'test-secret',
      version: 'v2',
    },
  },
}))

mock.module('node-fetch', () => ({
  default: mockFetch,
}))

// `downloadImage` uses fs.createWriteStream and pipes res.body into it.
const fs = await import('fs')
const writeStreamMock = {
  on: mock(function (this: any, _e: string, cb: () => void) {
    if (_e === 'finish') cb()
    return this
  }),
}
const fsSpy = mock(function () {
  return writeStreamMock
}) as ReturnType<typeof mock>
mock.module('fs', () => ({
  default: fs,
  createWriteStream: fsSpy,
}))

const { downloadImage } = await import('./imageGenerator')

describe('imageGenerator.downloadImage', () => {
  it('pipes the upstream body into a write stream at the destination', async () => {
    const body = {
      pipe: mock(function (this: any) {
        return this
      }),
      on: mock(),
    }
    mockFetch.mockResolvedValue({ ok: true, body })

    await downloadImage('https://images.example/x.png', '/tmp/out.png')

    expect(mockFetch).toHaveBeenCalledWith('https://images.example/x.png')
    expect(fsSpy).toHaveBeenCalledWith('/tmp/out.png')
    expect(body.pipe).toHaveBeenCalledWith(writeStreamMock)
  })

  it('rejects when the upstream body emits an error', async () => {
    const body = {
      pipe: mock(function (this: any) {
        return this
      }),
      on: mock(function (this: any, _e: string, cb: (err: Error) => void) {
        if (_e === 'error') cb(new Error('stream failed'))
        return this
      }),
    }
    mockFetch.mockResolvedValue({ ok: true, body })

    await expect(downloadImage('https://images.example/x.png', '/tmp/out.png')).rejects.toThrow(
      'stream failed'
    )
  })

  it('rejects when the upstream responds with a non-OK status', async () => {
    fsSpy.mockClear()
    mockFetch.mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' })

    await expect(
      downloadImage('https://images.example/missing.png', '/tmp/out.png')
    ).rejects.toThrow('404 Not Found')
    expect(fsSpy).not.toHaveBeenCalled()
  })

  it('rejects when the upstream response has no body', async () => {
    fsSpy.mockClear()
    mockFetch.mockResolvedValue({ ok: true, body: null })

    await expect(downloadImage('https://images.example/empty.png', '/tmp/out.png')).rejects.toThrow(
      'Failed to download image'
    )
    expect(fsSpy).not.toHaveBeenCalled()
  })

  it('rejects when the write stream emits an error', async () => {
    const body = {
      pipe: mock(function (this: any) {
        return this
      }),
      on: mock(),
    }
    const failingWriteStream = {
      on: mock(function (this: any, _e: string, cb: (err: Error) => void) {
        if (_e === 'error') cb(new Error('disk full'))
        return this
      }),
    }
    const fsSpyFail = mock(function () {
      return failingWriteStream
    }) as never
    mock.module('fs', () => ({
      default: fs,
      createWriteStream: fsSpyFail,
    }))
    mockFetch.mockResolvedValue({ ok: true, body })

    await expect(downloadImage('https://images.example/x.png', '/tmp/out.png')).rejects.toThrow(
      'disk full'
    )
  })
})
