package experiments.muthuishere.dualcrypt.crypto.symmeetric;



import org.springframework.stereotype.Service;


import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

@Service
public class SymmetricCryptoService {

    private static final SecureRandom RNG = new SecureRandom();
    private static final int IV_BYTES = 12;       // 96-bit IV (GCM standard)
    private static final int GCM_TAG_BITS = 128;  // 128-bit auth tag
    private static final Base64.Encoder B64E = Base64.getEncoder();
    private static final Base64.Decoder B64D = Base64.getDecoder();

    public record SymmetricBundle(String secretB64, String saltB64) {}

    /** Generate a random 32B secret + 16B salt */
    public SymmetricBundle generateSymmetricBundle() {
        byte[] secret = randomBytes(32);
        byte[] salt   = randomBytes(16);
        return new SymmetricBundle(B64E.encodeToString(secret), B64E.encodeToString(salt));
    }

    /** Encrypt → returns ONE base64 string: dataB64 = base64( IV(12B) || CIPHERTEXT||TAG ) */
    public String encrypt(String plaintext, String secretB64, String saltB64) throws GeneralSecurityException {
        byte[] iv = randomBytes(IV_BYTES);
        SecretKey aesKey = hkdfAesKey(secretB64, saltB64);

        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.ENCRYPT_MODE, aesKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
        byte[] ct = c.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

        byte[] packed = new byte[iv.length + ct.length];
        System.arraycopy(iv, 0, packed, 0, iv.length);
        System.arraycopy(ct, 0, packed, iv.length, ct.length);
        return B64E.encodeToString(packed);
    }

    /** Decrypt from the packed base64 string produced by encrypt() */
    public String decrypt(String dataB64, String secretB64, String saltB64) throws GeneralSecurityException {
        byte[] packed = B64D.decode(dataB64);
        if (packed.length <= IV_BYTES) throw new GeneralSecurityException("cipher too short");
        byte[] iv = Arrays.copyOfRange(packed, 0, IV_BYTES);
        byte[] ct = Arrays.copyOfRange(packed, IV_BYTES, packed.length);

        SecretKey aesKey = hkdfAesKey(secretB64, saltB64);
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.DECRYPT_MODE, aesKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
        byte[] pt = c.doFinal(ct);
        return new String(pt, StandardCharsets.UTF_8);
    }

    // ----- HKDF-SHA256 (RFC 5869) -----
    private static SecretKey hkdfAesKey(String secretB64, String saltB64) throws GeneralSecurityException {
        byte[] ikm  = B64D.decode(secretB64);            // 32B random secret
        if (ikm.length != 32) throw new GeneralSecurityException("secret must be 32 bytes");
        byte[] salt = B64D.decode(saltB64);              // 16B salt recommended

        byte[] prk = hmacSha256(salt, ikm);              // extract
        byte[] okm = hkdfExpand(prk, new byte[0], 32);   // expand to 32B
        return new SecretKeySpec(okm, "AES");
    }

    private static byte[] hkdfExpand(byte[] prk, byte[] info, int length) throws GeneralSecurityException {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(prk, "HmacSHA256"));
        int hashLen = 32, n = (int)Math.ceil((double)length / hashLen), off = 0;
        byte[] t = new byte[0], okm = new byte[length];
        for (int i = 1; i <= n; i++) {
            mac.reset(); mac.update(t); mac.update(info); mac.update((byte)i);
            t = mac.doFinal();
            int copy = Math.min(hashLen, length - off);
            System.arraycopy(t, 0, okm, off, copy); off += copy;
        }
        return okm;
    }

    private static byte[] hmacSha256(byte[] key, byte[] data) throws GeneralSecurityException {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key, "HmacSHA256"));
        return mac.doFinal(data);
    }

    private static byte[] randomBytes(int n) { byte[] b = new byte[n]; RNG.nextBytes(b); return b; }
}
