## RSA-OAEP Decryption - Spring Boot

Decrypt messages using RSA-OAEP with SHA-256 in Spring Boot.

### Service Implementation

```java
package experiments.muthuishere.dualcrypt.crypto.asymmetric;

import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import java.security.spec.MGF1ParameterSpec;

import javax.crypto.spec.OAEPParameterSpec;
import javax.crypto.spec.PSource;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.*;
import java.util.Base64;

@Service
public class AsymmetricCryptoService {

    private static final int RSA_BITS = 2048;

    // For RSA-2048 with OAEP-SHA256: 256 - 2*32 - 2 = 190 bytes
    private static final int MAX_PLAINTEXT_BYTES = (RSA_BITS / 8) - 2 * 32 - 2;

    /** Decrypt ciphertext with RSA-OAEP SHA-256 private key */
    public String decrypt(String cipherB64, String privateKeyB64) throws GeneralSecurityException {
        PrivateKey prv = loadPrivateKey(privateKeyB64);
        Cipher c = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
        c.init(Cipher.DECRYPT_MODE, prv, oaep256());
        byte[] plain = c.doFinal(Base64.getDecoder().decode(cipherB64));
        return new String(plain, StandardCharsets.UTF_8);
    }

    // ===== Helpers =====
    private static OAEPParameterSpec oaep256() {
        return new OAEPParameterSpec("SHA-256", "MGF1", MGF1ParameterSpec.SHA256, PSource.PSpecified.DEFAULT);
    }

    private static PrivateKey loadPrivateKey(String b64) throws GeneralSecurityException {
        byte[] der = Base64.getDecoder().decode(b64);
        return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(der));
    }
}
```

### REST Controller

```java
package experiments.muthuishere.dualcrypt.crypto.asymmetric;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api/asymmetric")
public class AsymmetricCryptoController {

    private final AsymmetricCryptoService service;

    public AsymmetricCryptoController(AsymmetricCryptoService service) {
        this.service = service;
    }

    // --- DTOs ---
    public record DecryptRequest(@NotBlank String cipherB64, @NotBlank String privateKeyB64) {}
    public record TextResponse(String text) {}

    @PostMapping("/decrypt")
    public TextResponse decrypt(@Valid @RequestBody DecryptRequest req) {
        try {
            String plaintext = service.decrypt(req.cipherB64(), req.privateKeyB64());
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
curl -X POST http://localhost:8080/api/asymmetric/decrypt \
  -H "Content-Type: application/json" \
  -d '{
    "cipherB64": "CjGAmJLgpPCt73gCEEF0aJK9GRnG2ph8Tv...",
    "privateKeyB64": "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC..."
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
        String plaintext = service.decrypt(req.cipherB64(), req.privateKeyB64());
        return new TextResponse(plaintext);
    } catch (GeneralSecurityException e) {
        if (e.getMessage().contains("Decryption error") || e.getMessage().contains("BadPaddingException")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Decryption failed: wrong private key or corrupted data", e);
        } else if (e.getMessage().contains("InvalidKeyException")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Invalid private key format", e);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Decryption failed: " + e.getMessage(), e);
        }
    } catch (IllegalArgumentException e) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
            "Invalid base64 encoding", e);
    }
}
```

### Key Features

- **RSA-OAEP**: Optimal Asymmetric Encryption Padding with SHA-256
- **PKCS#8 Import**: Standard private key format for interoperability
- **Integrity Verification**: OAEP padding automatically verifies authenticity
- **Secure Decryption**: Only private key holder can decrypt messages
- **Detailed Error Handling**: Clear error messages for debugging

### Security Notes

- OAEP padding automatically verifies integrity during decryption
- Decryption will fail with `BadPaddingException` if data is tampered with or wrong key used
- Private key must be kept secure and never shared or logged
- Server-side processing provides additional security isolation
- Constant-time operations in Java crypto APIs protect against timing attacks
- Proper error handling prevents information leakage about failure reasons

### Common Decryption Errors

- **BadPaddingException**: Wrong private key or corrupted ciphertext
- **InvalidKeyException**: Malformed PKCS#8 private key
- **IllegalBlockSizeException**: Invalid ciphertext size
- **IllegalArgumentException**: Invalid base64 encoding

Always implement proper error handling to provide meaningful feedback while avoiding security information leakage.
