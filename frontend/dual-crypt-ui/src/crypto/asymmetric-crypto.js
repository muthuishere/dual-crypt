// asymmetric-crypto.js
// RSA-OAEP (SHA-256) with SPKI/PKCS#8 Base64 keys. Interops with your Spring AsymmetricCryptoService.

const te = new TextEncoder();
const td = new TextDecoder();

const b64 = {
  enc(buf) {
    const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  },
  dec(str) {
    const bin = atob(str);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  },
};

function subtle() {
  const s = globalThis.crypto?.subtle;
  if (!s) throw new Error("Web Crypto API not available in this environment");
  return s;
}

/** Generate RSA keypair (2048) + random salt (16B). Exports keys to Base64 (SPKI/PKCS#8). */
export async function genRsaBundle() {
  const kp = await subtle().generateKey(
    { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["encrypt", "decrypt"]
  );
  const spki = await subtle().exportKey("spki", kp.publicKey);
  const pkcs8 = await subtle().exportKey("pkcs8", kp.privateKey);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { publicKeyB64: b64.enc(spki), privateKeyB64: b64.enc(pkcs8), saltB64: b64.enc(salt) };
}

export async function importRsaPublicKey(spkiB64) {
  return subtle().importKey("spki", b64.dec(spkiB64), { name: "RSA-OAEP", hash: "SHA-256" }, true, ["encrypt"]);
}

export async function importRsaPrivateKey(pkcs8B64) {
  return subtle().importKey("pkcs8", b64.dec(pkcs8B64), { name: "RSA-OAEP", hash: "SHA-256" }, true, ["decrypt"]);
}

/** Encrypt plaintext with RSA-OAEP(SHA-256). Accepts base64 public key or a CryptoKey. */
export async function rsaEncrypt(plaintext, publicKeyB64OrKey) {
  const key = typeof publicKeyB64OrKey === "string" ? await importRsaPublicKey(publicKeyB64OrKey) : publicKeyB64OrKey;
  const ct = await subtle().encrypt({ name: "RSA-OAEP" }, key, te.encode(plaintext));
  return b64.enc(ct);
}

/** Decrypt base64 ciphertext with RSA-OAEP(SHA-256). Accepts base64 private key or CryptoKey. */
export async function rsaDecrypt(cipherB64, privateKeyB64OrKey) {
  const key = typeof privateKeyB64OrKey === "string" ? await importRsaPrivateKey(privateKeyB64OrKey) : privateKeyB64OrKey;
  const pt = await subtle().decrypt({ name: "RSA-OAEP" }, key, b64.dec(cipherB64));
  return td.decode(pt);
}

// Optional quick demo
export async function demoAsymmetric() {
  const b = await genRsaBundle();
  const cipherB64 = await rsaEncrypt("hello-rsa", b.publicKeyB64);
  const plaintext = await rsaDecrypt(cipherB64, b.privateKeyB64);
  return { ...b, cipherB64, plaintext };
}
