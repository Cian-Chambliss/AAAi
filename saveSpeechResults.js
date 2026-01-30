const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const https = require('https');
const http = require('http');

function buildOutputPath(baseFile, format) {
  const ext = path.extname(baseFile);
  if (!ext && format) return `${baseFile}.${format}`;
  return baseFile;
}

function extractAudioEntries(result) {
  const out = [];
  if (!result) return out;

  // ai-sdk-provider typical shape
  if (result.audio && typeof result.audio === 'object') {
    const a = result.audio;
    if (a.uint8ArrayData) {
      const buf = Buffer.from(a.uint8ArrayData);
      out.push({ buffer: buf, format: a.format });
    } else if (a.base64) {
      try {
        const buf = Buffer.from(a.base64, 'base64');
        out.push({ buffer: buf, format: a.format });
      } catch (e) {
        // ignore, will try url below
      }
    } else if (a.url) {
      out.push({ url: a.url, format: a.format });
    }
  }

  // OpenAI-like or generic url on root
  if (result.url && typeof result.url === 'string') {
    out.push({ url: result.url });
  }

  // Nested wrappers
  if (result.output) {
    const nested = extractAudioEntries(result.output);
    out.push(...nested);
  }

  // Arrays
  if (Array.isArray(result)) {
    result.forEach((r) => out.push(...extractAudioEntries(r)));
  } else if (typeof result === 'object') {
    const numericKeys = Object.keys(result).filter((k) => /^\d+$/.test(k));
    numericKeys
      .sort((a, b) => Number(a) - Number(b))
      .forEach((k) => out.push(...extractAudioEntries(result[k])));
  }

  return out;
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

function makeSpeechResultSaver() {
  return async function saveSpeech(result, requestedOutputFile) {
    const entries = extractAudioEntries(result);
    if (!entries.length) {
      const keys = result && typeof result === 'object' ? Object.keys(result) : [];
      return [{ error: `No audio data found in result shape: ${keys.join(',')}` }];
    }

    // Only first entry is relevant per request
    const first = entries[0];
    const outPath = buildOutputPath(requestedOutputFile, first.format);

    if (first.buffer) {
      try {
        await fsp.writeFile(outPath, first.buffer);
        return [{ filename: outPath }];
      } catch (e) {
        return [{ error: `Write failed for ${outPath}: ${e.message}` }];
      }
    }

    if (first.url) {
      const res = await downloadToFile(first.url, outPath);
      return [res];
    }

    return [{ error: 'Unsupported audio result shape' }];
  };
}

module.exports = makeSpeechResultSaver;
