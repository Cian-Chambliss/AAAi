const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const https = require('https');
const http = require('http');

function extractBase64Images(result) {
  if (!result) return [];
  if (typeof result === 'string') return [result];

  if (result.image && typeof result.image === 'object' && result.image.base64) {
    return [result.image.base64];
  }

  if (Array.isArray(result.images)) {
    const arr = result.images
      .map((img) => {
        if (!img) return null;
        if (typeof img === 'string') return img;
        if (img.base64) return img.base64;
        if (img.b64_json) return img.b64_json;
        if (img.image && img.image.base64) return img.image.base64;
        return null;
      })
      .filter(Boolean);
    if (arr.length) return arr;
  }

  if (Array.isArray(result.data)) {
    const arr = result.data
      .map((d) => (d ? d.b64_json || d.base64 || null : null))
      .filter(Boolean);
    if (arr.length) return arr;
  }

  if (result.output) {
    const nested = extractBase64Images(result.output);
    if (nested.length) return nested;
  }

  if (Array.isArray(result)) {
    const arr = result
      .map((img) => {
        if (!img) return null;
        if (typeof img === 'string') return img;
        if (img.base64) return img.base64;
        if (img.b64_json) return img.b64_json;
        if (img.image && img.image.base64) return img.image.base64;
        return null;
      })
      .filter(Boolean);
    if (arr.length) return arr;
  }

  if (typeof result === 'object') {
    const numericKeys = Object.keys(result).filter((k) => /^\d+$/.test(k));
    if (numericKeys.length) {
      const collected = [];
      numericKeys
        .sort((a, b) => Number(a) - Number(b))
        .forEach((k) => {
          const nested = extractBase64Images(result[k]);
          if (nested.length) collected.push(...nested);
        });
      if (collected.length) return collected;
    }
  }

  return [];
}

function extractImageUrls(result) {
  if (!result) return [];

  if (typeof result === 'object' && !Array.isArray(result)) {
    const single = result.imageURL || result.url || (result.image && result.image.url);
    if (typeof single === 'string') return [single];
  }

  if (Array.isArray(result)) {
    const arr = result
      .map((img) => {
        if (!img || typeof img !== 'object') return null;
        return img.imageURL || img.url || (img.image && img.image.url) || null;
      })
      .filter((u) => typeof u === 'string');
    if (arr.length) return arr;
  }

  if (Array.isArray(result.data)) {
    const arr = result.data
      .map((d) => (d ? d.url || null : null))
      .filter((u) => typeof u === 'string');
    if (arr.length) return arr;
  }

  if (result.output) {
    const nested = extractImageUrls(result.output);
    if (nested.length) return nested;
  }

  if (typeof result === 'object') {
    const numericKeys = Object.keys(result).filter((k) => /^\d+$/.test(k));
    if (numericKeys.length) {
      const collected = [];
      numericKeys
        .sort((a, b) => Number(a) - Number(b))
        .forEach((k) => {
          const nested = extractImageUrls(result[k]);
          if (nested.length) collected.push(...nested);
        });
      if (collected.length) return collected;
    }
  }

  return [];
}

function buildOutputPath(baseFile, index, total) {
  const ext = path.extname(baseFile) || '.png';
  const dir = path.dirname(baseFile);
  const name = path.basename(baseFile, ext);
  if (total <= 1) return baseFile;
  return path.join(dir, `${name}-${index + 1}${ext}`);
}

async function saveB64ToFile(b64, outPath) {
  try {
    const buffer = Buffer.from(b64, 'base64');
    await fsp.writeFile(outPath, buffer);
    return { filename: outPath };
  } catch (e) {
    return { error: `Write failed for ${outPath}: ${e.message}` };
  }
}

function downloadToFile(url, outPath) {
  return new Promise((resolve) => {
    try {
      const client = url.startsWith('https:') ? https : http;
      client
        .get(url, (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return downloadToFile(res.headers.location, outPath).then(resolve);
          }
          if (res.statusCode !== 200) {
            res.resume();
            return resolve({ error: `HTTP ${res.statusCode} for ${url}` });
          }
          const fileStream = fs.createWriteStream(outPath);
          res.pipe(fileStream);
          fileStream.on('finish', () => fileStream.close(() => resolve({ filename: outPath })));
          fileStream.on('error', (e) => resolve({ error: `Stream error for ${outPath}: ${e.message}` }));
        })
        .on('error', (e) => resolve({ error: `Request error for ${url}: ${e.message}` }));
    } catch (e) {
      resolve({ error: `Download failed for ${url}: ${e.message}` });
    }
  });
}

function makeImageResultSaver() {
  return async function saveResult(result, requestedOutputFile) {
    const imagesBase64 = extractBase64Images(result);
    const imageUrls = imagesBase64.length ? [] : extractImageUrls(result);

    if (!imagesBase64.length && !imageUrls.length) {
      const keys = result && typeof result === 'object' ? Object.keys(result) : [];
      return [{ error: `No image data found in result shape: ${keys.join(',')}` }];
    }

    const total = imagesBase64.length || imageUrls.length;
    const tasks = [];

    if (imagesBase64.length) {
      imagesBase64.forEach((b64, i) => {
        const outPath = buildOutputPath(requestedOutputFile, i, total);
        tasks.push(saveB64ToFile(b64, outPath));
      });
    } else {
      imageUrls.forEach((url, i) => {
        const outPath = buildOutputPath(requestedOutputFile, i, total);
        tasks.push(downloadToFile(url, outPath));
      });
    }

    const results = await Promise.all(tasks);
    return results;
  };
}

module.exports = makeImageResultSaver;
