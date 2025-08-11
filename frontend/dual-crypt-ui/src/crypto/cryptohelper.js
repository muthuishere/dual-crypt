// import { genSymmetricBundle, aesEncrypt, aesDecrypt } from "./symmetric-crypto.js";
// import { genRsaBundle, rsaEncrypt, rsaDecrypt } from "./asymmetric-crypto.js";

// // AES-GCM
// const sym = genSymmetricBundle();
// const pack = await aesEncrypt("vanakkam", sym.secretB64, sym.saltB64);
// const text = await aesDecrypt(pack, sym.secretB64, sym.saltB64);

// // RSA-OAEP
// const rsa = await genRsaBundle();
// const c = await rsaEncrypt("namaste", rsa.publicKeyB64);
// const p = await rsaDecrypt(c, rsa.privateKeyB64);
