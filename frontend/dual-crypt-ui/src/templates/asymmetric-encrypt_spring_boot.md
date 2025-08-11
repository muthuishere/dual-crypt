## RSA-OAEP Encryption - Spring Boot

Encrypt messages using RSA-OAEP with SHA-256 in Spring Boot.

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

    /** Encrypt plaintext with RSA-OAEP SHA-256 public key */
    public String encrypt(String plaintext, String publicKeyB64) throws GeneralSecurityException {
        byte[] bytes = plaintext.getBytes(StandardCharsets.UTF_8);
        if (bytes.length > MAX_PLAINTEXT_BYTES) {
            throw new GeneralSecurityException("RSA-OAEP plaintext exceeds " + MAX_PLAINTEXT_BYTES + " bytes");
        }
        PublicKey pub = loadPublicKey(publicKeyB64);
        Cipher c = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
        c.init(Cipher.ENCRYPT_MODE, pub, oaep256());
        byte[] out = c.doFinal(bytes);
        return Base64.getEncoder().encodeToString(out);
    }

    // ===== Helpers =====
    private static OAEPParameterSpec oaep256() {
        return new OAEPParameterSpec("SHA-256", "MGF1", MGF1ParameterSpec.SHA256, PSource.PSpecified.DEFAULT);
    }

    private static PublicKey loadPublicKey(String b64) throws GeneralSecurityException {
        byte[] der = Base64.getDecoder().decode(b64);
        return KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(der));
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
    public record EncryptRequest(@NotBlank String plaintext, @NotBlank String publicKeyB64) {}
    public record TextResponse(String text) {}

    @PostMapping("/encrypt")
    public TextResponse encrypt(@Valid @RequestBody EncryptRequest req) {
        try {
            String cipherB64 = service.encrypt(req.plaintext(), req.publicKeyB64());
            return new TextResponse(cipherB64);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
    }
}
```

### Usage Example

```bash
## HTTP Request
curl -X POST http://localhost:8080/api/asymmetric/encrypt \
  -H "Content-Type: application/json" \
  -d '{
    "plaintext": "Hello, World!",
    "publicKeyB64": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."
  }'

## Response
{
  "text": "CjGAmJLgpPCt73gCEEF0aJK9GRnG2ph8Tv..."
}
```

### Key Features

- **RSA-OAEP**: Optimal Asymmetric Encryption Padding with SHA-256
- **X.509/SPKI**: Standard public key format for interoperability
- **Size Validation**: Automatically checks plaintext size limits (190 bytes for RSA-2048)
- **Enterprise Security**: Uses Java's battle-tested crypto APIs
- **Base64 Encoding**: Safe for JSON transport and storage

### Security Notes

- OAEP padding prevents chosen ciphertext attacks
- Each encryption produces different output due to random padding
- Plaintext size is limited to 190 bytes for RSA-2048 with OAEP-SHA256
- Public key encryption allows secure message sending
- Server-side processing keeps operations secure from client-side attacks
- Proper error handling prevents information leakage

### Plaintext Size Limits

RSA-OAEP with SHA-256 has size limitations:

- **RSA-2048**: Maximum 190 bytes plaintext
- **Formula**: (key_size_bytes) - 2*(hash_size_bytes) - 2
- **For larger data**: Use hybrid encryption (RSA + AES)

The service automatically validates and rejects oversized plaintexts with a clear error message.
