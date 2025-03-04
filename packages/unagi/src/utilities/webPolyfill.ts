import AbortController from 'abort-controller'
import fetch, { Headers, Request, Response } from 'node-fetch'
import { FormData } from 'undici'
import { ReadableStream, TransformStream, WritableStream } from 'web-streams-polyfill/ponyfill'

if (!globalThis.fetch) {
  Object.assign(globalThis, {
    fetch,
    Request,
    Response,
    Headers,
    AbortController,
  })
}

if (!globalThis.FormData) {
  Object.assign(globalThis, {
    FormData,
  })
}

if (!globalThis.ReadableStream) {
  Object.assign(globalThis, {
    ReadableStream,
    WritableStream,
    TransformStream,
  })
}
