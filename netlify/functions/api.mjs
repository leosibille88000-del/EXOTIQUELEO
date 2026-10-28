import { createRequire as __cr } from 'module'; const require = __cr(import.meta.url);

// node_modules/@netlify/runtime-utils/dist/main.js
var getString = (input) => typeof input === "string" ? input : JSON.stringify(input);
var base64Decode = globalThis.Buffer ? (input) => Buffer.from(input, "base64").toString() : (input) => atob(input);
var base64Encode = globalThis.Buffer ? (input) => Buffer.from(getString(input)).toString("base64") : (input) => btoa(getString(input));
var getEnvironment = () => {
  const { Deno, Netlify, process: process2 } = globalThis;
  return Netlify?.env ?? Deno?.env ?? {
    delete: (key) => delete process2?.env[key],
    get: (key) => process2?.env[key],
    has: (key) => Boolean(process2?.env[key]),
    set: (key, value) => {
      if (process2?.env) {
        process2.env[key] = value;
      }
    },
    toObject: () => process2?.env ?? {}
  };
};

// node_modules/@netlify/otel/dist/main.js
var GET_TRACER = "__netlify__getTracer";
var getTracer = (name, version) => {
  return globalThis[GET_TRACER]?.(name, version);
};
function withActiveSpan(tracer, name, optionsOrFn, contextOrFn, fn) {
  const func = typeof contextOrFn === "function" ? contextOrFn : typeof optionsOrFn === "function" ? optionsOrFn : fn;
  if (!func) {
    throw new Error("function to execute with active span is missing");
  }
  if (!tracer) {
    return func();
  }
  return tracer.withActiveSpan(name, optionsOrFn, contextOrFn, func);
}

// node_modules/@netlify/blobs/dist/chunk-SQCJ2S3G.js
var getEnvironmentContext = () => {
  const context = globalThis.netlifyBlobsContext || getEnvironment().get("NETLIFY_BLOBS_CONTEXT");
  if (typeof context !== "string" || !context) {
    return {};
  }
  const data = base64Decode(context);
  try {
    return JSON.parse(data);
  } catch {
  }
  return {};
};
var MissingBlobsEnvironmentError = class extends Error {
  constructor(requiredProperties) {
    super(
      `The environment has not been configured to use Netlify Blobs. To use it manually, supply the following properties when creating a store: ${requiredProperties.join(
        ", "
      )}`
    );
    this.name = "MissingBlobsEnvironmentError";
  }
};
var BASE64_PREFIX = "b64;";
var METADATA_HEADER_INTERNAL = "x-amz-meta-user";
var METADATA_HEADER_EXTERNAL = "netlify-blobs-metadata";
var METADATA_MAX_SIZE = 2 * 1024;
var encodeMetadata = (metadata) => {
  if (!metadata) {
    return null;
  }
  const encodedObject = base64Encode(JSON.stringify(metadata));
  const payload = `b64;${encodedObject}`;
  if (METADATA_HEADER_EXTERNAL.length + payload.length > METADATA_MAX_SIZE) {
    throw new Error("Metadata object exceeds the maximum size");
  }
  return payload;
};
var decodeMetadata = (header) => {
  if (!header?.startsWith(BASE64_PREFIX)) {
    return {};
  }
  const encodedData = header.slice(BASE64_PREFIX.length);
  const decodedData = base64Decode(encodedData);
  const metadata = JSON.parse(decodedData);
  return metadata;
};
var getMetadataFromResponse = (response) => {
  if (!response.headers) {
    return {};
  }
  const value = response.headers.get(METADATA_HEADER_EXTERNAL) || response.headers.get(METADATA_HEADER_INTERNAL);
  try {
    return decodeMetadata(value);
  } catch {
    throw new Error(
      "An internal error occurred while trying to retrieve the metadata for an entry. Please try updating to the latest version of the Netlify Blobs client."
    );
  }
};
var NF_ERROR = "x-nf-error";
var NF_REQUEST_ID = "x-nf-request-id";
var DEPLOY_STORE_PREFIX = "deploy:";
var SITE_STORE_PREFIX = "site:";
var isDeniedWrite = (res, { method, storeName }) => (res.status === 401 || res.status === 403) && (method === "put" || method === "delete") && storeName !== void 0 && !storeName.startsWith(DEPLOY_STORE_PREFIX);
var blobsErrorMessage = (res, context, responseBody) => {
  let details = res.headers.get(NF_ERROR) || `${res.status} status code`;
  if (res.headers.has(NF_REQUEST_ID)) {
    details += `, ID: ${res.headers.get(NF_REQUEST_ID)}`;
  }
  if (isDeniedWrite(res, context)) {
    const storeName = context.storeName?.startsWith(SITE_STORE_PREFIX) ? context.storeName.slice(SITE_STORE_PREFIX.length) : context.storeName;
    const summary = `Netlify Blobs could not write to store '${storeName}' (${details}).`;
    if (context.edgeAccess) {
      return summary;
    }
    return `${summary} Builds and build plugins can only write to deploy-specific stores: use 'getDeployStore' instead of 'getStore', or pass a 'token' with write access to the store. If this code is not running in a build, check that the token and site ID are valid. See https://docs.netlify.com/build/data-and-storage/netlify-blobs/#deploy-specific-stores`;
  }
  let message = `Netlify Blobs has generated an internal error (${details})`;
  if (!res.headers.get(NF_ERROR) && responseBody) {
    message += `: ${responseBody}`;
  }
  return message;
};
var BlobsInternalError = class extends Error {
  constructor(res, context = {}, responseBody) {
    super(blobsErrorMessage(res, context, responseBody));
    this.name = "BlobsInternalError";
    this.status = res.status;
    this.responseBody = responseBody;
  }
};
var createBlobsInternalError = async (res, context = {}) => {
  const responseBody = await res.clone().text().catch(() => void 0);
  return new BlobsInternalError(res, context, responseBody);
};
var discardBody = async (res) => {
  await res.body?.cancel().catch(() => {
  });
};
var collectIterator = async (iterator) => {
  const result = [];
  for await (const item of iterator) {
    result.push(item);
  }
  return result;
};
function withSpan(span, name, fn) {
  if (span) return fn(span);
  return withActiveSpan(getTracer(), name, (span2) => {
    return fn(span2);
  });
}
var BlobsConsistencyError = class extends Error {
  constructor() {
    super(
      `Netlify Blobs has failed to perform a read using strong consistency because the environment has not been configured with a 'uncachedEdgeURL' property`
    );
    this.name = "BlobsConsistencyError";
  }
};
var REGION_AUTO = "auto";
var regions = {
  "us-east-1": true,
  "us-east-2": true,
  "eu-central-1": true,
  "ap-southeast-1": true,
  "ap-southeast-2": true
};
var isValidRegion = (input) => Object.keys(regions).includes(input);
var InvalidBlobsRegionError = class extends Error {
  constructor(region) {
    super(
      `${region} is not a supported Netlify Blobs region. Supported values are: ${Object.keys(regions).join(", ")}.`
    );
    this.name = "InvalidBlobsRegionError";
  }
};
var DEFAULT_RETRY_DELAY = getEnvironment().get("NODE_ENV") === "test" ? 1 : 5e3;
var MIN_RETRY_DELAY = 1e3;
var MAX_RETRY = 5;
var RATE_LIMIT_HEADER = "X-RateLimit-Reset";
var fetchAndRetry = async (fetch2, url, options, attemptsLeft = MAX_RETRY, getRetryUrl) => {
  try {
    const res = await fetch2(url, options);
    const isRetryable = res.status === 429 || res.status >= 500 || getRetryUrl !== void 0 && res.status === 403;
    if (attemptsLeft > 0 && isRetryable) {
      await discardBody(res);
      const delay = getDelay(res.headers.get(RATE_LIMIT_HEADER));
      await sleep(delay);
      const retryUrl = getRetryUrl ? await getRetryUrl() : url;
      return fetchAndRetry(fetch2, retryUrl, options, attemptsLeft - 1, getRetryUrl);
    }
    return res;
  } catch (error) {
    if (attemptsLeft === 0) {
      throw error;
    }
    const delay = getDelay();
    await sleep(delay);
    const retryUrl = getRetryUrl ? await getRetryUrl() : url;
    return fetchAndRetry(fetch2, retryUrl, options, attemptsLeft - 1, getRetryUrl);
  }
};
var getDelay = (rateLimitReset) => {
  if (!rateLimitReset) {
    return DEFAULT_RETRY_DELAY;
  }
  return Math.max(Number(rateLimitReset) * 1e3 - Date.now(), MIN_RETRY_DELAY);
};
var sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});
var SIGNED_URL_ACCEPT_HEADER = "application/json;type=signed-url";
var Client = class {
  /**
   * Whether requests reach Blobs through the edge rather than the API. Only
   * runtime environments are given an edge URL.
   */
  get edgeAccess() {
    return this.edgeURL !== void 0;
  }
  constructor({ apiURL, consistency, edgeURL, fetch: fetch2, region, siteID, token, uncachedEdgeURL }) {
    this.apiURL = apiURL;
    this.consistency = consistency ?? "eventual";
    this.edgeURL = edgeURL;
    this.fetch = fetch2 ?? globalThis.fetch;
    this.region = region;
    this.siteID = siteID;
    this.token = token;
    this.uncachedEdgeURL = uncachedEdgeURL;
    if (!this.fetch) {
      throw new Error(
        "Netlify Blobs could not find a `fetch` client in the global scope. You can either update your runtime to a version that includes `fetch` (like Node.js 18.0.0 or above), or you can supply your own implementation using the `fetch` property."
      );
    }
  }
  async getFinalRequest({
    consistency: opConsistency,
    key,
    metadata,
    method,
    parameters = {},
    storeName
  }) {
    const encodedMetadata = encodeMetadata(metadata);
    const consistency = opConsistency ?? this.consistency;
    let urlPath = `/${this.siteID}`;
    if (storeName) {
      urlPath += `/${storeName}`;
    }
    if (key) {
      urlPath += `/${key}`;
    }
    if (this.edgeURL) {
      if (consistency === "strong" && !this.uncachedEdgeURL) {
        throw new BlobsConsistencyError();
      }
      const headers = {
        authorization: `Bearer ${this.token}`
      };
      if (encodedMetadata) {
        headers[METADATA_HEADER_INTERNAL] = encodedMetadata;
      }
      if (this.region) {
        urlPath = `/region:${this.region}${urlPath}`;
      }
      const url2 = new URL(urlPath, consistency === "strong" ? this.uncachedEdgeURL : this.edgeURL);
      for (const key2 in parameters) {
        url2.searchParams.set(key2, parameters[key2]);
      }
      return {
        headers,
        url: url2.toString()
      };
    }
    const apiHeaders = { authorization: `Bearer ${this.token}` };
    const url = new URL(`/api/v1/blobs${urlPath}`, this.apiURL ?? "https://api.netlify.com");
    for (const key2 in parameters) {
      url.searchParams.set(key2, parameters[key2]);
    }
    if (this.region) {
      url.searchParams.set("region", this.region);
    }
    if (storeName === void 0 || key === void 0) {
      return {
        headers: apiHeaders,
        url: url.toString()
      };
    }
    if (encodedMetadata) {
      apiHeaders[METADATA_HEADER_EXTERNAL] = encodedMetadata;
    }
    if (method === "head" || method === "delete") {
      return {
        headers: apiHeaders,
        url: url.toString()
      };
    }
    const res = await this.fetch(url.toString(), {
      headers: { ...apiHeaders, accept: SIGNED_URL_ACCEPT_HEADER },
      method
    });
    if (res.status !== 200) {
      throw await createBlobsInternalError(res, { edgeAccess: this.edgeAccess, method, storeName });
    }
    const { url: signedURL } = await res.json();
    const userHeaders = encodedMetadata ? { [METADATA_HEADER_INTERNAL]: encodedMetadata } : void 0;
    return {
      headers: userHeaders,
      url: signedURL
    };
  }
  async makeRequest({
    body,
    conditions = {},
    consistency,
    headers: extraHeaders,
    key,
    metadata,
    method,
    parameters,
    storeName
  }) {
    const { headers: baseHeaders = {}, url } = await this.getFinalRequest({
      consistency,
      key,
      metadata,
      method,
      parameters,
      storeName
    });
    const headers = {
      ...baseHeaders,
      ...extraHeaders
    };
    if (method === "put") {
      headers["cache-control"] = "max-age=0, stale-while-revalidate=60";
    }
    if ("onlyIfMatch" in conditions && conditions.onlyIfMatch) {
      headers["if-match"] = conditions.onlyIfMatch;
    } else if ("onlyIfNew" in conditions && conditions.onlyIfNew) {
      headers["if-none-match"] = "*";
    }
    const options = {
      body,
      headers,
      method
    };
    if (body instanceof ReadableStream) {
      options.duplex = "half";
    }
    const usesSignedUrl = !this.edgeURL && key !== void 0 && storeName !== void 0 && method !== "head" && method !== "delete";
    let getRetryUrl;
    if (usesSignedUrl) {
      getRetryUrl = async () => {
        const finalRequest = await this.getFinalRequest({ consistency, key, metadata, method, parameters, storeName });
        return finalRequest.url;
      };
    }
    return fetchAndRetry(this.fetch, url, options, void 0, getRetryUrl);
  }
};
var getClientOptions = (options, contextOverride) => {
  const context = contextOverride ?? getEnvironmentContext();
  const siteID = context.siteID ?? options.siteID;
  const token = context.token ?? options.token;
  if (!siteID || !token) {
    throw new MissingBlobsEnvironmentError(["siteID", "token"]);
  }
  if (options.region !== void 0 && !isValidRegion(options.region)) {
    throw new InvalidBlobsRegionError(options.region);
  }
  const clientOptions = {
    apiURL: context.apiURL ?? options.apiURL,
    consistency: options.consistency,
    edgeURL: context.edgeURL ?? options.edgeURL,
    fetch: options.fetch,
    region: options.region,
    siteID,
    token,
    uncachedEdgeURL: context.uncachedEdgeURL ?? options.uncachedEdgeURL
  };
  return clientOptions;
};

// node_modules/@netlify/blobs/dist/main.js
var LEGACY_STORE_INTERNAL_PREFIX = "netlify-internal/legacy-namespace/";
var STATUS_OK = 200;
var STATUS_PRE_CONDITION_FAILED = 412;
var STATUS_CONFLICT = 409;
var Store = class _Store {
  constructor(options) {
    this.client = options.client;
    if ("deployID" in options) {
      _Store.validateDeployID(options.deployID);
      let name = DEPLOY_STORE_PREFIX + options.deployID;
      if (options.name) {
        name += `:${options.name}`;
      }
      this.name = name;
    } else if (options.name.startsWith(LEGACY_STORE_INTERNAL_PREFIX)) {
      const storeName = options.name.slice(LEGACY_STORE_INTERNAL_PREFIX.length);
      _Store.validateStoreName(storeName);
      this.name = storeName;
    } else {
      _Store.validateStoreName(options.name);
      this.name = SITE_STORE_PREFIX + options.name;
    }
  }
  async delete(key) {
    const res = await this.client.makeRequest({ key, method: "delete", storeName: this.name });
    await discardBody(res);
    if (![200, 204, 404].includes(res.status)) {
      throw new BlobsInternalError(res, {
        edgeAccess: this.client.edgeAccess,
        method: "delete",
        storeName: this.name
      });
    }
  }
  async deleteAll() {
    let totalDeletedBlobs = 0;
    let hasMore = true;
    while (hasMore) {
      const res = await this.client.makeRequest({ method: "delete", storeName: this.name });
      if (res.status !== 200) {
        await discardBody(res);
        throw new BlobsInternalError(res, {
          edgeAccess: this.client.edgeAccess,
          method: "delete",
          storeName: this.name
        });
      }
      const data = await res.json();
      if (typeof data.blobs_deleted !== "number") {
        throw new BlobsInternalError(res);
      }
      totalDeletedBlobs += data.blobs_deleted;
      hasMore = typeof data.has_more === "boolean" && data.has_more;
    }
    return {
      deletedBlobs: totalDeletedBlobs
    };
  }
  async get(key, options) {
    return withSpan(options?.span, "blobs.get", async (span) => {
      const { consistency, type } = options ?? {};
      span?.setAttributes({
        "blobs.store": this.name,
        "blobs.key": key,
        "blobs.type": type,
        "blobs.method": "GET",
        "blobs.consistency": consistency
      });
      const res = await this.client.makeRequest({
        consistency,
        key,
        method: "get",
        storeName: this.name
      });
      span?.setAttributes({
        "blobs.response.body.size": res.headers.get("content-length") ?? void 0,
        "blobs.response.status": res.status
      });
      if (res.status === 404) {
        await discardBody(res);
        return null;
      }
      if (res.status !== 200) {
        await discardBody(res);
        throw new BlobsInternalError(res);
      }
      if (type === void 0 || type === "text") {
        return res.text();
      }
      if (type === "arrayBuffer") {
        return res.arrayBuffer();
      }
      if (type === "blob") {
        return res.blob();
      }
      if (type === "json") {
        return res.json();
      }
      if (type === "stream") {
        return res.body;
      }
      await discardBody(res);
      throw new BlobsInternalError(res);
    });
  }
  async getMetadata(key, options = {}) {
    return withSpan(options?.span, "blobs.getMetadata", async (span) => {
      span?.setAttributes({
        "blobs.store": this.name,
        "blobs.key": key,
        "blobs.method": "HEAD",
        "blobs.consistency": options.consistency
      });
      const res = await this.client.makeRequest({
        consistency: options.consistency,
        key,
        method: "head",
        storeName: this.name
      });
      span?.setAttributes({
        "blobs.response.status": res.status
      });
      if (res.status === 404) {
        return null;
      }
      if (res.status !== 200 && res.status !== 304) {
        throw new BlobsInternalError(res);
      }
      const etag = res?.headers.get("etag") ?? void 0;
      const metadata = getMetadataFromResponse(res);
      const result = {
        etag,
        metadata
      };
      return result;
    });
  }
  async getWithMetadata(key, options) {
    return withSpan(options?.span, "blobs.getWithMetadata", async (span) => {
      const { consistency, etag: requestETag, type } = options ?? {};
      const headers = requestETag ? { "if-none-match": requestETag } : void 0;
      span?.setAttributes({
        "blobs.store": this.name,
        "blobs.key": key,
        "blobs.method": "GET",
        "blobs.consistency": options?.consistency,
        "blobs.type": type,
        "blobs.request.etag": requestETag
      });
      const res = await this.client.makeRequest({
        consistency,
        headers,
        key,
        method: "get",
        storeName: this.name
      });
      const responseETag = res?.headers.get("etag") ?? void 0;
      span?.setAttributes({
        "blobs.response.body.size": res.headers.get("content-length") ?? void 0,
        "blobs.response.etag": responseETag,
        "blobs.response.status": res.status
      });
      if (res.status === 404) {
        await discardBody(res);
        return null;
      }
      if (res.status !== 200 && res.status !== 304) {
        await discardBody(res);
        throw new BlobsInternalError(res);
      }
      const metadata = getMetadataFromResponse(res);
      const result = {
        etag: responseETag,
        metadata
      };
      if (res.status === 304 && requestETag) {
        return { data: null, ...result };
      }
      if (type === void 0 || type === "text") {
        return { data: await res.text(), ...result };
      }
      if (type === "arrayBuffer") {
        return { data: await res.arrayBuffer(), ...result };
      }
      if (type === "blob") {
        return { data: await res.blob(), ...result };
      }
      if (type === "json") {
        return { data: await res.json(), ...result };
      }
      if (type === "stream") {
        return { data: res.body, ...result };
      }
      await discardBody(res);
      throw new Error(`Invalid 'type' property: ${type}. Expected: arrayBuffer, blob, json, stream, or text.`);
    });
  }
  list(options = {}) {
    return withSpan(options.span, "blobs.list", (span) => {
      span?.setAttributes({
        "blobs.store": this.name,
        "blobs.method": "GET",
        "blobs.list.paginate": options.paginate ?? false
      });
      const iterator = this.getListIterator(options);
      if (options.paginate) {
        return iterator;
      }
      return collectIterator(iterator).then(
        (items) => items.reduce(
          (acc, item) => ({
            blobs: [...acc.blobs, ...item.blobs],
            directories: [...acc.directories, ...item.directories]
          }),
          { blobs: [], directories: [] }
        )
      );
    });
  }
  async set(key, data, options = {}) {
    return withSpan(options.span, "blobs.set", async (span) => {
      span?.setAttributes({
        "blobs.store": this.name,
        "blobs.key": key,
        "blobs.method": "PUT",
        "blobs.data.size": typeof data == "string" ? data.length : data instanceof Blob ? data.size : data.byteLength,
        "blobs.data.type": typeof data == "string" ? "string" : data instanceof Blob ? "blob" : "arrayBuffer",
        "blobs.atomic": Boolean(options.onlyIfMatch ?? options.onlyIfNew)
      });
      _Store.validateKey(key);
      const conditions = _Store.getConditions(options);
      const res = await this.client.makeRequest({
        conditions,
        body: data,
        key,
        metadata: options.metadata,
        method: "put",
        storeName: this.name
      });
      const etag = res.headers.get("etag") ?? "";
      span?.setAttributes({
        "blobs.response.etag": etag,
        "blobs.response.status": res.status
      });
      if (conditions) {
        if (res.status === STATUS_PRE_CONDITION_FAILED || res.status === STATUS_CONFLICT) {
          await discardBody(res);
          return { modified: false };
        }
        if (res.ok) {
          await discardBody(res);
          return { etag, modified: true };
        }
        throw await createBlobsInternalError(res, {
          edgeAccess: this.client.edgeAccess,
          method: "put",
          storeName: this.name
        });
      }
      if (res.status === STATUS_OK) {
        await discardBody(res);
        return {
          etag,
          modified: true
        };
      }
      throw await createBlobsInternalError(res, {
        edgeAccess: this.client.edgeAccess,
        method: "put",
        storeName: this.name
      });
    });
  }
  async setJSON(key, data, options = {}) {
    return withSpan(options.span, "blobs.setJSON", async (span) => {
      span?.setAttributes({
        "blobs.store": this.name,
        "blobs.key": key,
        "blobs.method": "PUT",
        "blobs.data.type": "json",
        "blobs.atomic": Boolean(options.onlyIfMatch ?? options.onlyIfNew)
      });
      _Store.validateKey(key);
      const conditions = _Store.getConditions(options);
      const payload = JSON.stringify(data);
      const headers = {
        "content-type": "application/json"
      };
      const res = await this.client.makeRequest({
        conditions,
        body: payload,
        headers,
        key,
        metadata: options.metadata,
        method: "put",
        storeName: this.name
      });
      const etag = res.headers.get("etag") ?? "";
      span?.setAttributes({
        "blobs.response.etag": etag,
        "blobs.response.status": res.status
      });
      if (conditions) {
        if (res.status === STATUS_PRE_CONDITION_FAILED || res.status === STATUS_CONFLICT) {
          await discardBody(res);
          return { modified: false };
        }
        if (res.ok) {
          await discardBody(res);
          return { etag, modified: true };
        }
        throw await createBlobsInternalError(res, {
          edgeAccess: this.client.edgeAccess,
          method: "put",
          storeName: this.name
        });
      }
      if (res.status === STATUS_OK) {
        await discardBody(res);
        return {
          etag,
          modified: true
        };
      }
      throw await createBlobsInternalError(res, {
        edgeAccess: this.client.edgeAccess,
        method: "put",
        storeName: this.name
      });
    });
  }
  static formatListResultBlob(result) {
    if (!result.key) {
      return null;
    }
    return {
      etag: result.etag,
      key: result.key
    };
  }
  static getConditions(options) {
    if ("onlyIfMatch" in options && "onlyIfNew" in options) {
      throw new Error(
        `The 'onlyIfMatch' and 'onlyIfNew' options are mutually exclusive. Using 'onlyIfMatch' will make the write succeed only if there is an entry for the key with the given content, while 'onlyIfNew' will make the write succeed only if there is no entry for the key.`
      );
    }
    if ("onlyIfMatch" in options && options.onlyIfMatch) {
      if (typeof options.onlyIfMatch !== "string") {
        throw new Error(`The 'onlyIfMatch' property expects a string representing an ETag.`);
      }
      return {
        onlyIfMatch: options.onlyIfMatch
      };
    }
    if ("onlyIfNew" in options && options.onlyIfNew) {
      if (typeof options.onlyIfNew !== "boolean") {
        throw new Error(
          `The 'onlyIfNew' property expects a boolean indicating whether the write should fail if an entry for the key already exists.`
        );
      }
      return {
        onlyIfNew: true
      };
    }
  }
  static validateKey(key) {
    if (key === "") {
      throw new Error("Blob key must not be empty.");
    }
    if (key.startsWith("/") || key.startsWith("%2F")) {
      throw new Error("Blob key must not start with forward slash (/).");
    }
    if (new TextEncoder().encode(key).length > 600) {
      throw new Error(
        "Blob key must be a sequence of Unicode characters whose UTF-8 encoding is at most 600 bytes long."
      );
    }
  }
  static validateDeployID(deployID) {
    if (!/^\w{1,24}$/.test(deployID)) {
      throw new Error(`'${deployID}' is not a valid Netlify deploy ID.`);
    }
  }
  static validateStoreName(name) {
    if (name.includes("/") || name.includes("%2F")) {
      throw new Error("Store name must not contain forward slashes (/).");
    }
    if (new TextEncoder().encode(name).length > 64) {
      throw new Error(
        "Store name must be a sequence of Unicode characters whose UTF-8 encoding is at most 64 bytes long."
      );
    }
  }
  getListIterator(options) {
    const { client, name: storeName } = this;
    const parameters = {};
    if (options?.prefix) {
      parameters.prefix = options.prefix;
    }
    if (options?.directories) {
      parameters.directories = "true";
    }
    return {
      [Symbol.asyncIterator]() {
        let currentCursor = null;
        let done = false;
        return {
          async next() {
            return withSpan(options?.span, "blobs.list.next", async (span) => {
              span?.setAttributes({
                "blobs.store": storeName,
                "blobs.method": "GET",
                "blobs.list.paginate": options?.paginate ?? false,
                "blobs.list.done": done,
                "blobs.list.cursor": currentCursor ?? void 0
              });
              if (done) {
                return { done: true, value: void 0 };
              }
              const nextParameters = { ...parameters };
              if (currentCursor !== null) {
                nextParameters.cursor = currentCursor;
              }
              const res = await client.makeRequest({
                method: "get",
                parameters: nextParameters,
                storeName
              });
              span?.setAttributes({
                "blobs.response.status": res.status
              });
              let blobs = [];
              let directories = [];
              if (![200, 204, 404].includes(res.status)) {
                await discardBody(res);
                throw new BlobsInternalError(res);
              }
              if (res.status === 404) {
                await discardBody(res);
                done = true;
              } else {
                const page = await res.json();
                if (page.next_cursor) {
                  currentCursor = page.next_cursor;
                } else {
                  done = true;
                }
                blobs = (page.blobs ?? []).map(_Store.formatListResultBlob).filter(Boolean);
                directories = page.directories ?? [];
              }
              return {
                done: false,
                value: {
                  blobs,
                  directories
                }
              };
            });
          }
        };
      }
    };
  }
};
var getDeployStoreRegion = (clientOptions, context) => {
  if (clientOptions.region) {
    return clientOptions.region;
  }
  if (clientOptions.edgeURL || clientOptions.uncachedEdgeURL) {
    if (!context.primaryRegion) {
      throw new Error(
        "When accessing a deploy store, the Netlify Blobs client needs to be configured with a region, and one was not found in the environment. To manually set the region, set the `region` property in the store options. If you are using the Netlify CLI, you may have an outdated version; run `npm install -g netlify-cli@latest` to update and try again."
      );
    }
    return context.primaryRegion;
  }
  return REGION_AUTO;
};
var getStore = (input, options) => {
  if (typeof input === "string") {
    const contextOverride = options?.siteID && options?.token ? { siteID: options?.siteID, token: options?.token } : void 0;
    const clientOptions = getClientOptions(options ?? {}, contextOverride);
    const client = new Client(clientOptions);
    return new Store({ client, name: input });
  }
  if (typeof input?.name === "string") {
    const { name } = input;
    const contextOverride = input?.siteID && input?.token ? { siteID: input?.siteID, token: input?.token } : void 0;
    const clientOptions = getClientOptions(input, contextOverride);
    if (!name) {
      throw new MissingBlobsEnvironmentError(["name"]);
    }
    const client = new Client(clientOptions);
    return new Store({ client, name });
  }
  if (typeof input?.deployID === "string") {
    const context = getEnvironmentContext();
    const clientOptions = getClientOptions(input, context);
    const { deployID } = input;
    if (!deployID) {
      throw new MissingBlobsEnvironmentError(["deployID"]);
    }
    clientOptions.region = getDeployStoreRegion(clientOptions, context);
    const client = new Client(clientOptions);
    return new Store({ client, deployID });
  }
  throw new Error(
    "The `getStore` method requires the name of the store as a string or as the `name` property of an options object"
  );
};

// api.src.mjs
import crypto from "node:crypto";
var ADMIN_NAME = "EXOTIQUELEO";
var DEFAULT_PRICE = 3;
var env = (...names) => names.map((n) => process.env[n]).find((v) => v && String(v).trim()) || "";
var json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
});
var Fail = class extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
};
var store = () => getStore({ name: "exotiqueleo", consistency: "strong" });
async function load(key, fallback) {
  const v = await store().get(key, { type: "json" });
  return v == null ? fallback : v;
}
var save = (key, value) => store().setJSON(key, value);
async function settings() {
  const s = await load("settings", {});
  if (!s.secret) {
    s.secret = crypto.randomBytes(32).toString("hex");
    await save("settings", s);
  }
  if (typeof s.price !== "number") s.price = DEFAULT_PRICE;
  if (!("examples" in s)) s.examples = null;
  return s;
}
function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  return salt + ":" + crypto.scryptSync(password, salt, 64).toString("hex");
}
function checkPassword(password, stored) {
  if (!stored || !password) return false;
  const [salt, hash] = stored.split(":");
  const test = crypto.scryptSync(password, salt, 64);
  const real = Buffer.from(hash, "hex");
  return real.length === test.length && crypto.timingSafeEqual(real, test);
}
function sameText(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function makeToken(s, pseudo, admin) {
  const body = Buffer.from(JSON.stringify({ p: pseudo, a: !!admin, e: Date.now() + 30 * 864e5 })).toString("base64url");
  const sig = crypto.createHmac("sha256", s.secret).update(body).digest("base64url");
  return body + "." + sig;
}
async function readToken(s, token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const good = crypto.createHmac("sha256", s.secret).update(body).digest("base64url");
  if (!sameText(sig, good)) return null;
  let d;
  try {
    d = JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    return null;
  }
  if (!d || d.e < Date.now()) return null;
  if (d.a) return { pseudo: ADMIN_NAME, admin: true };
  const users = await load("users", {});
  const u = users[d.p.toLowerCase()];
  return u ? { pseudo: u.pseudo, discord: u.discord, admin: false } : null;
}
function couponProblem(c, pseudo) {
  if (!c) return "Ce code n'existe pas.";
  if (!c.active) return "Ce code n'est plus actif.";
  if (c.expires && Date.now() > (/* @__PURE__ */ new Date(c.expires + "T23:59:59")).getTime()) return "Ce code a expir\xE9.";
  if (c.maxUses && c.uses >= c.maxUses) return "Ce code est \xE9puis\xE9 : il n'en reste plus.";
  if (pseudo && (c.usedBy || []).includes(pseudo.toLowerCase())) return "Tu as d\xE9j\xE0 utilis\xE9 ce code.";
  return null;
}
function priceWith(price, c) {
  if (!c) return price;
  const t = c.type === "percent" ? price * (1 - c.value / 100) : price - c.value;
  return Math.max(0, Math.round(t * 100) / 100);
}
var couponLabel = (c) => c.type === "percent" ? "-" + c.value + " %" : "-" + Number(c.value).toFixed(2).replace(".", ",") + " \u20AC";
var publicCoupon = (c) => ({ ...c, usedBy: void 0, left: c.maxUses ? Math.max(0, c.maxUses - c.uses) : null });
async function markPaid(o) {
  o.status = "pay\xE9e";
  o.paidAt = (/* @__PURE__ */ new Date()).toISOString();
  if (!o.coupon) return;
  const coupons = await load("coupons", {});
  const c = coupons[o.coupon];
  if (!c) return;
  c.uses = (c.uses || 0) + 1;
  c.usedBy = [.../* @__PURE__ */ new Set([...c.usedBy || [], o.user.toLowerCase()])];
  await save("coupons", coupons);
}
function cleanPseudo(name, users) {
  let base = String(name || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w.-]/g, "").slice(0, 16);
  if (base.length < 3) base = "Createur";
  if (base.toLowerCase() === ADMIN_NAME.toLowerCase()) base = base + "_";
  let p = base, n = 1;
  while (users[p.toLowerCase()]) p = base.slice(0, 16) + ++n;
  return p;
}
async function socialUser(provider, id, name, discord) {
  const users = await load("users", {});
  let u = Object.values(users).find((x) => x.provider === provider && x.providerId === id);
  if (!u) {
    u = { pseudo: cleanPseudo(name, users), discord: discord || "", provider, providerId: id, created: (/* @__PURE__ */ new Date()).toISOString() };
    users[u.pseudo.toLowerCase()] = u;
    await save("users", users);
  }
  return u;
}
var appleKeys = null;
async function verifyAppleToken(idToken, clientId) {
  const [h, p, sig] = idToken.split(".");
  const head = JSON.parse(Buffer.from(h, "base64url").toString());
  const pay = JSON.parse(Buffer.from(p, "base64url").toString());
  if (!appleKeys || !appleKeys.find((k) => k.kid === head.kid)) appleKeys = (await (await fetch("https://appleid.apple.com/auth/keys")).json()).keys;
  const jwk = appleKeys.find((k) => k.kid === head.kid);
  if (!jwk) throw new Fail("Connexion Apple refus\xE9e.", 401);
  const ok = crypto.verify("RSA-SHA256", Buffer.from(h + "." + p), crypto.createPublicKey({ key: jwk, format: "jwk" }), Buffer.from(sig, "base64url"));
  if (!ok || pay.iss !== "https://appleid.apple.com" || pay.aud !== clientId || pay.exp * 1e3 < Date.now()) throw new Fail("Connexion Apple refus\xE9e.", 401);
  return pay;
}
var paypal = {
  id: () => env("PAYPAL_CLIENT_ID", "PAYPAL_ID"),
  secret: () => env("PAYPAL_SECRET", "PAYPAL_CLIENT_SECRET", "PAYPAL_SECRET_KEY"),
  base: () => /sandbox|test/i.test(env("PAYPAL_MODE", "PAYPAL_ENV")) ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com",
  async token() {
    const r = await fetch(this.base() + "/v1/oauth2/token", {
      method: "POST",
      headers: { Authorization: "Basic " + Buffer.from(this.id() + ":" + this.secret()).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials"
    });
    const d = await r.json();
    if (!d.access_token) throw new Fail("PayPal refuse la connexion : v\xE9rifie PAYPAL_CLIENT_ID et PAYPAL_SECRET sur Netlify.", 500);
    return d.access_token;
  },
  async call(path, body) {
    const r = await fetch(this.base() + path, {
      method: "POST",
      headers: { Authorization: "Bearer " + await this.token(), "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : void 0
    });
    return r.json();
  }
};
var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
async function fetchTikTok(user) {
  const r = await fetch("https://www.tiktok.com/@" + user, { headers: { "User-Agent": UA, "Accept-Language": "fr-FR,fr;q=0.9" } });
  const html = await r.text();
  const m = html.match(/"followerCount":(\d+)/);
  return m ? Number(m[1]) : null;
}
async function fetchYouTube(handle2) {
  const r = await fetch("https://www.youtube.com/@" + handle2 + "/about", { headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" } });
  const html = await r.text();
  const m = html.match(/"subscriberCountText":"([\d.,]+)\s*([KM]?)/) || html.match(/([\d.,]+)([KM]?) subscribers?/);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Math.round(n * (m[2] === "K" ? 1e3 : m[2] === "M" ? 1e6 : 1));
}
async function stats(s) {
  const manual = s.stats || {};
  const cache = await load("statsCache", null);
  if (cache && Date.now() - cache.at < 10 * 6e4) return { ...cache, goal: manual.goal || 7e3 };
  const [tt, yt] = await Promise.all([fetchTikTok("exotiqueleo").catch(() => null), fetchYouTube("EXOTIQUELEO").catch(() => null)]);
  const out = {
    tiktok: tt ?? manual.tiktok ?? (cache && cache.tiktok) ?? null,
    youtube: yt ?? manual.youtube ?? (cache && cache.youtube) ?? null,
    live: { tiktok: tt != null, youtube: yt != null },
    at: Date.now()
  };
  await save("statsCache", out);
  return { ...out, goal: manual.goal || 7e3 };
}
async function handle(action, d, s) {
  const me = await readToken(s, d.token);
  const need = (admin) => {
    if (!me) throw new Fail("Connecte-toi d'abord.", 401);
    if (admin && !me.admin) throw new Fail("R\xE9serv\xE9 \xE0 l'admin.", 403);
  };
  const orders = () => load("orders", []);
  const findOrder = (list, id) => {
    const o = list.find((x) => x.id === id);
    if (!o || !me.admin && o.user !== me.pseudo) throw new Fail("Demande introuvable.", 404);
    return o;
  };
  switch (action) {
    case "config":
      return {
        price: s.price,
        examples: s.examples,
        timer: s.timer && s.timer.active ? s.timer : null,
        paypalClientId: paypal.id() && paypal.secret() ? paypal.id() : null,
        google: env("GOOGLE_CLIENT_ID") || false,
        apple: env("APPLE_CLIENT_ID", "APPLE_SERVICE_ID") || false,
        discord: env("DISCORD_CLIENT_ID") && env("DISCORD_CLIENT_SECRET") ? env("DISCORD_CLIENT_ID") : false,
        adminReady: !!(s.adminHash || env("ADMIN_PASSWORD", "ADMIN_PASS", "ADMIN_PWD", "ADMIN_MDP", "MOT_DE_PASSE_ADMIN"))
      };
    case "stats":
      return await stats(s);
    case "timerSave": {
      need(true);
      if (d.remove) {
        s.timer = null;
        await save("settings", s);
        return { timer: null };
      }
      const title = String(d.title || "").trim().slice(0, 80);
      const end = new Date(d.end);
      if (!title) throw new Fail("Mets un titre au minuteur.");
      if (isNaN(end)) throw new Fail("Choisis la date et l'heure de fin.");
      s.timer = { title, desc: String(d.desc || "").trim().slice(0, 300), end: end.toISOString(), active: d.active !== false, endText: String(d.endText || "").trim().slice(0, 80) };
      await save("settings", s);
      return { timer: s.timer };
    }
    case "statsSave": {
      need(true);
      const num = (v) => v === "" || v == null ? null : Math.max(0, Math.floor(Number(v)));
      s.stats = { tiktok: num(d.tiktok), youtube: num(d.youtube), goal: num(d.goal) || 7e3 };
      await save("settings", s);
      await save("statsCache", null);
      return { stats: s.stats };
    }
    case "register": {
      const pseudo = String(d.pseudo || "").trim();
      if (!/^[\w.-]{3,20}$/.test(pseudo)) throw new Fail("Pseudo : 3 \xE0 20 caract\xE8res (lettres, chiffres, _ . -).");
      if (pseudo.toLowerCase() === ADMIN_NAME.toLowerCase()) throw new Fail("Ce pseudo est r\xE9serv\xE9.");
      if (!String(d.discord || "").trim()) throw new Fail("Mets ton pseudo Discord.");
      if (String(d.password || "").length < 6) throw new Fail("Mot de passe : 6 caract\xE8res minimum.");
      const users = await load("users", {});
      if (users[pseudo.toLowerCase()]) throw new Fail("Ce pseudo est d\xE9j\xE0 pris.");
      users[pseudo.toLowerCase()] = { pseudo, discord: d.discord.trim().slice(0, 40), hash: hashPassword(d.password), created: (/* @__PURE__ */ new Date()).toISOString() };
      await save("users", users);
      return { token: makeToken(s, pseudo, false), user: { pseudo, discord: d.discord.trim(), admin: false } };
    }
    case "login": {
      const pseudo = String(d.pseudo || "").trim();
      const password = String(d.password || "");
      if (pseudo.toLowerCase() === ADMIN_NAME.toLowerCase()) {
        const envPass = env("ADMIN_PASSWORD", "ADMIN_PASS", "ADMIN_PWD", "ADMIN_MDP", "MOT_DE_PASSE_ADMIN");
        let ok = false;
        if (s.adminHash) ok = checkPassword(password, s.adminHash);
        if (!ok && envPass) ok = sameText(password, envPass);
        if (!s.adminHash && !envPass) {
          if (password.length < 6) throw new Fail("Premi\xE8re connexion admin : choisis un mot de passe d'au moins 6 caract\xE8res. Il sera enregistr\xE9.");
          s.adminHash = hashPassword(password);
          await save("settings", s);
          ok = true;
        }
        if (!ok) throw new Fail("Mot de passe admin incorrect.", 401);
        return { token: makeToken(s, ADMIN_NAME, true), user: { pseudo: ADMIN_NAME, admin: true } };
      }
      const users = await load("users", {});
      const u = users[pseudo.toLowerCase()];
      if (!u || !checkPassword(password, u.hash)) throw new Fail("Pseudo ou mot de passe incorrect.", 401);
      return { token: makeToken(s, u.pseudo, false), user: { pseudo: u.pseudo, discord: u.discord, admin: false } };
    }
    case "social": {
      if (d.provider === "google") {
        const cid = env("GOOGLE_CLIENT_ID");
        if (!cid || !d.idToken) throw new Fail("Connexion Google indisponible.");
        const info = await (await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(d.idToken))).json();
        if (info.aud !== cid || !info.sub) throw new Fail("Connexion Google refus\xE9e.", 401);
        const u = await socialUser("google", info.sub, info.given_name || info.name || (info.email || "").split("@")[0]);
        return { token: makeToken(s, u.pseudo, false), user: { pseudo: u.pseudo, discord: u.discord, admin: false } };
      }
      if (d.provider === "apple") {
        const cid = env("APPLE_CLIENT_ID", "APPLE_SERVICE_ID");
        if (!cid || !d.idToken) throw new Fail("Connexion Apple indisponible.");
        const pay = await verifyAppleToken(d.idToken, cid);
        const u = await socialUser("apple", pay.sub, d.name || (pay.email || "").split("@")[0]);
        return { token: makeToken(s, u.pseudo, false), user: { pseudo: u.pseudo, discord: u.discord, admin: false } };
      }
      throw new Fail("Connexion inconnue.");
    }
    case "me": {
      need();
      const list = me.admin ? [] : (await orders()).filter((o) => o.user === me.pseudo).reverse();
      return { user: me, orders: list };
    }
    case "quote": {
      const coupons = await load("coupons", {});
      const c = coupons[String(d.code || "").trim().toUpperCase()];
      const p = couponProblem(c, me && me.pseudo);
      if (p) throw new Fail(p);
      return { code: c.code, label: couponLabel(c), total: priceWith(s.price, c), price: s.price, left: c.maxUses ? c.maxUses - c.uses : null };
    }
    case "order": {
      need();
      if (me.admin) throw new Fail("Le compte admin ne peut pas commander.");
      const name = String(d.name || "").trim().slice(0, 60), discord = String(d.discord || "").trim().slice(0, 40);
      if (!name || !discord) throw new Fail("Mets au moins ton nom de cr\xE9ateur et ton pseudo Discord.");
      let c = null;
      if (d.code) {
        const coupons = await load("coupons", {});
        c = coupons[String(d.code).trim().toUpperCase()];
        const p = couponProblem(c, me.pseudo);
        if (p) throw new Fail(p);
      }
      const list = await orders();
      const id = crypto.randomBytes(6).toString("hex");
      const o = { id, ref: id.slice(0, 6).toUpperCase(), user: me.pseudo, name, discord, message: String(d.message || "").slice(0, 5e3), price: s.price, coupon: c ? c.code : null, total: priceWith(s.price, c), status: "en attente", created: (/* @__PURE__ */ new Date()).toISOString() };
      if (o.total === 0) await markPaid(o);
      list.push(o);
      await save("orders", list);
      return { order: o };
    }
    case "payCreate": {
      need();
      const list = await orders();
      const o = findOrder(list, d.orderId);
      if (o.status === "pay\xE9e" || o.status === "termin\xE9e") throw new Fail("Cette demande est d\xE9j\xE0 pay\xE9e.");
      if (o.coupon) {
        const coupons = await load("coupons", {});
        const p = couponProblem(coupons[o.coupon], o.user);
        if (p) throw new Fail(p + " Refais une demande sans ce code.");
      }
      if (!paypal.id() || !paypal.secret()) throw new Fail("Le paiement PayPal n'est pas encore activ\xE9.");
      const r = await paypal.call("/v2/checkout/orders", {
        intent: "CAPTURE",
        purchase_units: [{ reference_id: o.id, description: "Site EXOTIQUELEO n\xB0 " + o.ref, amount: { currency_code: "EUR", value: o.total.toFixed(2) } }]
      });
      if (!r.id) throw new Fail("PayPal n'a pas pu cr\xE9er le paiement.", 502);
      o.paypalId = r.id;
      if (o.status === "annul\xE9e") o.status = "en attente";
      await save("orders", list);
      return { paypalId: r.id };
    }
    case "payCapture": {
      need();
      const list = await orders();
      const o = findOrder(list, d.orderId);
      if (o.status === "pay\xE9e" || o.status === "termin\xE9e") return { order: o };
      if (!o.paypalId || d.paypalId && d.paypalId !== o.paypalId) throw new Fail("Paiement introuvable.");
      const r = await paypal.call("/v2/checkout/orders/" + o.paypalId + "/capture");
      const cap = r.purchase_units && r.purchase_units[0].payments && r.purchase_units[0].payments.captures && r.purchase_units[0].payments.captures[0];
      if (r.status !== "COMPLETED" || !cap || Number(cap.amount.value) < o.total) throw new Fail("PayPal n'a pas valid\xE9 le paiement.");
      await markPaid(o);
      await save("orders", list);
      return { order: o };
    }
    case "payCancel": {
      need();
      const list = await orders();
      const o = findOrder(list, d.orderId);
      if (o.status === "en attente") {
        o.status = "annul\xE9e";
        await save("orders", list);
      }
      return { order: o };
    }
    // ----- admin -----
    case "adminData": {
      need(true);
      const [list, coupons, users] = await Promise.all([orders(), load("coupons", {}), load("users", {})]);
      return {
        orders: list.slice().reverse(),
        coupons: Object.values(coupons).map(publicCoupon),
        users: Object.values(users).map((u) => ({ pseudo: u.pseudo, discord: u.discord, provider: u.provider, created: u.created, orders: list.filter((o) => o.user === u.pseudo).length })),
        price: s.price,
        examples: s.examples,
        stats: s.stats || {},
        timer: s.timer || null
      };
    }
    case "couponSave": {
      need(true);
      const code = String(d.code || "").trim().toUpperCase();
      if (!/^[A-Z0-9_-]{3,20}$/.test(code)) throw new Fail("Code : 3 \xE0 20 caract\xE8res (lettres, chiffres, _ -).");
      const value = Number(d.value);
      if (!(value > 0)) throw new Fail("Mets une r\xE9duction plus grande que 0.");
      if (d.type === "percent" && value > 100) throw new Fail("Une r\xE9duction en % ne peut pas d\xE9passer 100.");
      const coupons = await load("coupons", {});
      const old = coupons[code];
      coupons[code] = {
        code,
        type: d.type === "fixed" ? "fixed" : "percent",
        value,
        maxUses: d.maxUses ? Math.max(1, Math.floor(d.maxUses)) : null,
        expires: d.expires || null,
        active: d.active !== false,
        uses: old ? old.uses : 0,
        usedBy: old ? old.usedBy || [] : [],
        created: old ? old.created : (/* @__PURE__ */ new Date()).toISOString()
      };
      await save("coupons", coupons);
      return { coupon: publicCoupon(coupons[code]) };
    }
    case "couponDelete": {
      need(true);
      const coupons = await load("coupons", {});
      delete coupons[String(d.code || "").toUpperCase()];
      await save("coupons", coupons);
      return { ok: true };
    }
    case "orderUpdate": {
      need(true);
      const list = await orders();
      const o = findOrder(list, d.orderId);
      if (!["en attente", "pay\xE9e", "annul\xE9e", "termin\xE9e"].includes(d.status)) throw new Fail("Statut inconnu.");
      o.status = d.status;
      if (d.status === "termin\xE9e") {
        o.doneAt = o.doneAt || (/* @__PURE__ */ new Date()).toISOString();
        if (d.siteUrl !== void 0) o.siteUrl = /^https?:\/\//i.test(d.siteUrl || "") ? d.siteUrl : null;
      }
      await save("orders", list);
      return { order: o };
    }
    case "orderDelete": {
      need(true);
      await save("orders", (await orders()).filter((o) => o.id !== d.orderId));
      return { ok: true };
    }
    case "userDelete": {
      need(true);
      const users = await load("users", {});
      delete users[String(d.pseudo || "").toLowerCase()];
      await save("users", users);
      return { ok: true };
    }
    case "priceSave": {
      need(true);
      const price = Math.round(Number(String(d.price).replace(",", ".")) * 100) / 100;
      if (!(price >= 0.5 && price <= 1e3)) throw new Fail("Prix : entre 0,50 \u20AC et 1000 \u20AC.");
      s.price = price;
      await save("settings", s);
      return { price };
    }
    case "examplesSave": {
      need(true);
      if (!Array.isArray(d.examples)) throw new Fail("Liste d'exemples invalide.");
      const list = d.examples.slice(0, 30).map((x) => ({
        id: String(x.id || crypto.randomBytes(4).toString("hex")).slice(0, 20),
        name: String(x.name || "").trim().slice(0, 40),
        url: /^https?:\/\//i.test(x.url || "") ? String(x.url).slice(0, 300) : "",
        desc: String(x.desc || "").trim().slice(0, 200),
        img: /^data:image\/(jpeg|png|webp);base64,/.test(x.img || "") && x.img.length < 4e5 ? x.img : ""
      })).filter((x) => x.name && x.url);
      s.examples = list;
      await save("settings", s);
      return { examples: list };
    }
    case "adminPassword": {
      need(true);
      if (String(d.password || "").length < 6) throw new Fail("Mot de passe : 6 caract\xE8res minimum.");
      s.adminHash = hashPassword(String(d.password));
      await save("settings", s);
      return { ok: true };
    }
    default:
      throw new Fail("Action inconnue.");
  }
}
async function discordCallback(url, s) {
  const back = (params) => Response.redirect(url.origin + "/#" + new URLSearchParams(params).toString(), 302);
  const code = url.searchParams.get("code"), state = url.searchParams.get("state") || "";
  if (!code) return back({ auth_error: "Connexion Discord annul\xE9e.", state });
  try {
    const r = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env("DISCORD_CLIENT_ID"),
        client_secret: env("DISCORD_CLIENT_SECRET"),
        grant_type: "authorization_code",
        code,
        redirect_uri: url.origin + "/.netlify/functions/api"
      })
    });
    const t = await r.json();
    if (!t.access_token) throw new Error();
    const me = await (await fetch("https://discord.com/api/users/@me", { headers: { Authorization: "Bearer " + t.access_token } })).json();
    if (!me.id) throw new Error();
    const u = await socialUser("discord", me.id, me.global_name || me.username, me.username);
    return back({ auth: makeToken(s, u.pseudo, false), state });
  } catch {
    return back({ auth_error: "La connexion avec Discord n'a pas march\xE9, r\xE9essaie.", state });
  }
}
var api_src_default = async (req) => {
  try {
    const s = await settings();
    if (req.method === "GET") {
      const url = new URL(req.url);
      if (url.searchParams.has("code") || url.searchParams.has("error")) return discordCallback(url, s);
      return json({ ok: true });
    }
    if (req.method !== "POST") return json({ error: "M\xE9thode non autoris\xE9e." }, 405);
    const d = await req.json().catch(() => ({}));
    return json(await handle(String(d.action || ""), d, s));
  } catch (err) {
    if (err instanceof Fail) return json({ error: err.message }, err.status);
    console.error(err);
    return json({ error: "Le serveur a eu un probl\xE8me. R\xE9essaie dans un instant." }, 500);
  }
};
export {
  api_src_default as default
};
