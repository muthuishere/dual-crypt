## AES-256-GCM Decryption - Spring Boot

Decrypt messages using AES-256-GCM with HKDF-SHA256 key derivation in Spring Boot.

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
import java.util.Arrays;
import java.util.Base64;

@Service
public class SymmetricCryptoService {

    private static final int IV_BYTES = 12;       // 96-bit IV (GCM standard)
    private static final int GCM_TAG_BITS = 128;  // 128-bit auth tag
    private static final Base64.Decoder B64D = Base64.getDecoder();

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
    public record DecryptRequest(@NotBlank String dataB64,
                                 @NotBlank String secretB64,
                                 @NotBlank String saltB64) {}
    public record TextResponse(String text) {}

    @PostMapping("/decrypt")
    public TextResponse decrypt(@Valid @RequestBody DecryptRequest req) {
        try {
            String plaintext = service.decrypt(req.dataB64(), req.secretB64(), req.saltB64());
            return new TextResponse(plaintext);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
    }
}
```

### Usage Example

```bash
## HTTP Request
curl -X POST http://localhost:8080/api/symmetric/decrypt \
  -H "Content-Type: application/json" \
  -d '{
    "dataB64": "+Mr7ZDSWMCjGAmJLgpPCt73gCEEF0aJK9GRnG2ph8Tv...",
    "secretB64": "GcHrUKLfctsYthcVPLnr...",
    "saltB64": "1EwAqBTFzVC16RaT0MZt..."
  }'

## Response
{
  "text": "Hello, World!"
}
```

### Error Handling

The service handles various decryption failures:

```java
// Custom exception handling for better error messages
@PostMapping("/decrypt")
public TextResponse decrypt(@Valid @RequestBody DecryptRequest req) {
    try {
        String plaintext = service.decrypt(req.dataB64(), req.secretB64(), req.saltB64());
        return new TextResponse(plaintext);
    } catch (GeneralSecurityException e) {
        if (e.getMessage().contains("cipher too short")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Invalid encrypted data: too short", e);
        } else if (e.getMessage().contains("secret must be 32 bytes")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Invalid secret key: must be 32 bytes", e);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Decryption failed: data may be corrupted or key incorrect", e);
        }
    } catch (IllegalArgumentException e) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
            "Invalid base64 encoding", e);
    }
}
```

### Key Features

- **AES-256-GCM**: Authenticated decryption with integrity verification
- **HKDF-SHA256**: RFC 5869 compliant key derivation
- **Automatic Unpacking**: Extracts IV and ciphertext from packed format
- **Integrity Verification**: GCM mode automatically verifies authenticity
- **Detailed Error Handling**: Clear error messages for debugging

### Security Notes

- GCM mode automatically verifies message authenticity and integrity
- Decryption will fail with `AEADBadTagException` if data is tampered with
- HKDF ensures secure key derivation following RFC 5869
- Server-side processing provides additional security isolation
- Constant-time operations in Java crypto APIs protect against timing attacks
- Proper error handling prevents information leakage about failure reasons
