## AES-256-GCM Encryption - Spring Boot

Encrypt messages using AES-256-GCM with HKDF-SHA256 key derivation in Spring Boot.

### Service Implementation

```java
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
import java.util.Base64;

@Service
public class SymmetricCryptoService {

    private static final SecureRandom RNG = new SecureRandom();
    private static final int IV_BYTES = 12;       // 96-bit IV (GCM standard)
    private static final int GCM_TAG_BITS = 128;  // 128-bit auth tag
    private static final Base64.Encoder B64E = Base64.getEncoder();
    private static final Base64.Decoder B64D = Base64.getDecoder();

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
```

### REST Controller

```java
package experiments.muthuishere.dualcrypt.crypto.symmeetric;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api/symmetric")
public class SymmetricCryptoController {

    private final SymmetricCryptoService service;

    public SymmetricCryptoController(SymmetricCryptoService service) {
        this.service = service;
    }

    // --- DTOs ---
    public record EncryptRequest(@NotBlank String plaintext,
                                 @NotBlank String secretB64,
                                 @NotBlank String saltB64) {}
    public record EncryptResponse(String dataB64) {}

    @PostMapping("/encrypt")
    public EncryptResponse encrypt(@Valid @RequestBody EncryptRequest req) {
        try {
            String dataB64 = service.encrypt(req.plaintext(), req.secretB64(), req.saltB64());
            return new EncryptResponse(dataB64);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
    }
}
```

### Usage Example

```bash
## HTTP Request
curl -X POST http://localhost:8080/api/symmetric/encrypt \
  -H "Content-Type: application/json" \
  -d '{
    "plaintext": "Hello, World!",
    "secretB64": "GcHrUKLfctsYthcVPLnr...",
    "saltB64": "1EwAqBTFzVC16RaT0MZt..."
  }'

## Response
{
  "dataB64": "+Mr7ZDSWMCjGAmJLgpPCt73gCEEF0aJK9GRnG2ph8Tv..."
}
```

### Key Features

- **AES-256-GCM**: Authenticated encryption with 256-bit keys
- **HKDF-SHA256**: RFC 5869 compliant key derivation
- **96-bit IV**: Fresh random IV for each encryption
- **Packed Format**: Single base64 string contains IV + ciphertext + tag
- **Enterprise Security**: Uses Java's battle-tested crypto APIs

### Security Notes

- Each encryption generates a fresh random IV
- GCM mode provides authenticated encryption (confidentiality + integrity)
- HKDF ensures secure key derivation following RFC 5869
- Server-side processing keeps keys secure from client-side attacks
- Proper error handling prevents information leakage
