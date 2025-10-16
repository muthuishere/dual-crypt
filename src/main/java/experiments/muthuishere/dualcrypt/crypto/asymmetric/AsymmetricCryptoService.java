package experiments.muthuishere.dualcrypt.crypto.asymmetric;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import java.io.IOException;
import java.security.spec.MGF1ParameterSpec;

import javax.crypto.spec.OAEPParameterSpec;
import javax.crypto.spec.PSource;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.*;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class AsymmetricCryptoService {

    private static final SecureRandom RNG = new SecureRandom();
    private static final int RSA_BITS = 2048;
    private static final int SALT_BYTES = 16;
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    // For RSA-2048 with OAEP-SHA256: 256 - 2*32 - 2 = 190 bytes
    private static final int MAX_PLAINTEXT_BYTES = (RSA_BITS / 8) - 2 * 32 - 2;

    public record RsaBundle(
        @Schema(description = "Base64-encoded RSA public key in X.509 format", example = "MIIBIjANBgkqhkiG9w0BAQEF...")
        String publicKeyB64, 
        @Schema(description = "Base64-encoded RSA private key in PKCS#8 format", example = "MIIEvgIBADANBgkqhkiG9w0BAQEF...")
        String privateKeyB64, 
        @Schema(description = "Base64-encoded random salt", example = "AbCdEfGhIjKlMnOp")
        String saltB64
    ) {}

    public RsaBundle generateRsaBundle() throws GeneralSecurityException {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(RSA_BITS, RNG);
        KeyPair kp = kpg.generateKeyPair();
        byte[] salt = new byte[SALT_BYTES];
        RNG.nextBytes(salt);

        return new RsaBundle(
                Base64.getEncoder().encodeToString(kp.getPublic().getEncoded()),    // X.509/SPKI
                Base64.getEncoder().encodeToString(kp.getPrivate().getEncoded()),   // PKCS#8
                Base64.getEncoder().encodeToString(salt)
        );
    }

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

    /** Decrypt ciphertext with RSA-OAEP SHA-256 private key */
    public String decrypt(String cipherB64, String privateKeyB64) throws GeneralSecurityException {
        PrivateKey prv = loadPrivateKey(privateKeyB64);
        Cipher c = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
        c.init(Cipher.DECRYPT_MODE, prv, oaep256());
        byte[] plain = c.doFinal(Base64.getDecoder().decode(cipherB64));
        return new String(plain, StandardCharsets.UTF_8);
    }

    /** Sign data with RSA SHA-256 private key and return JWT token */
    public String sign(String data, String privateKeyB64) throws GeneralSecurityException {
        try {
            // Create JWT header
            Map<String, Object> header = Map.of(
                "alg", "RS256",
                "typ", "JWT"
            );
            
            // Create JWT payload - detect if data is JSON or simple string
            Map<String, Object> payload = new HashMap<>();
            if (isValidJson(data)) {
                // Parse JSON string into claims
                Map<String, Object> claims = OBJECT_MAPPER.readValue(data, new TypeReference<Map<String, Object>>() {});
                payload.putAll(claims);
            } else {
                // Simple string - wrap in a claim
                payload.put("data", data);
            }
            
            // Add timestamp claims if not present
            long now = Instant.now().getEpochSecond();
            payload.putIfAbsent("iat", now); // issued at
            payload.putIfAbsent("exp", now + 3600); // expires in 1 hour
            
            // Encode header and payload
            String headerB64 = base64UrlEncode(OBJECT_MAPPER.writeValueAsBytes(header));
            String payloadB64 = base64UrlEncode(OBJECT_MAPPER.writeValueAsBytes(payload));
            
            // Create signature input: header.payload
            String signatureInput = headerB64 + "." + payloadB64;
            
            // Sign the input
            PrivateKey prv = loadPrivateKey(privateKeyB64);
            Signature sig = Signature.getInstance("SHA256withRSA");
            sig.initSign(prv, RNG);
            sig.update(signatureInput.getBytes(StandardCharsets.UTF_8));
            byte[] signature = sig.sign();
            
            // Create final JWT: header.payload.signature
            String signatureB64 = base64UrlEncode(signature);
            return headerB64 + "." + payloadB64 + "." + signatureB64;
            
        } catch (JsonProcessingException e) {
            throw new GeneralSecurityException("Failed to process JSON: " + e.getMessage(), e);
        }
    }

    /** Verify JWT token and return original data */
    public String verify(String jwtToken, String publicKeyB64) throws GeneralSecurityException {
        try {
            // Split JWT into parts
            String[] parts = jwtToken.split("\\.");
            if (parts.length != 3) {
                throw new GeneralSecurityException("Invalid JWT format");
            }
            
            String headerB64 = parts[0];
            String payloadB64 = parts[1];
            String signatureB64 = parts[2];
            
            // Verify signature
            String signatureInput = headerB64 + "." + payloadB64;
            PublicKey pub = loadPublicKey(publicKeyB64);
            Signature sig = Signature.getInstance("SHA256withRSA");
            sig.initVerify(pub);
            sig.update(signatureInput.getBytes(StandardCharsets.UTF_8));
            byte[] signature = base64UrlDecode(signatureB64);
            
            if (!sig.verify(signature)) {
                throw new GeneralSecurityException("JWT signature verification failed");
            }
            
            // Parse payload to extract original data
            byte[] payloadBytes = base64UrlDecode(payloadB64);
            Map<String, Object> payload = OBJECT_MAPPER.readValue(payloadBytes, new TypeReference<Map<String, Object>>() {});
            
            // Check expiration if present
            if (payload.containsKey("exp")) {
                long exp = ((Number) payload.get("exp")).longValue();
                if (Instant.now().getEpochSecond() > exp) {
                    throw new GeneralSecurityException("JWT token has expired");
                }
            }
            
            // Return original data
            if (payload.containsKey("data")) {
                // Was a simple string
                return (String) payload.get("data");
            } else {
                // Was JSON claims - return as JSON string
                Map<String, Object> claims = new HashMap<>(payload);
                // Remove standard JWT claims for cleaner output
                claims.remove("iat");
                claims.remove("exp");
                return OBJECT_MAPPER.writeValueAsString(claims);
            }
            
        } catch (JsonProcessingException e) {
            throw new GeneralSecurityException("Failed to process JWT: " + e.getMessage(), e);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    // ===== Helpers =====
    private static OAEPParameterSpec oaep256() {
        return new OAEPParameterSpec("SHA-256", "MGF1", MGF1ParameterSpec.SHA256, PSource.PSpecified.DEFAULT);
    }

    private static PublicKey loadPublicKey(String b64) throws GeneralSecurityException {
        byte[] der = Base64.getDecoder().decode(b64);
        return KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(der));
    }

    private static PrivateKey loadPrivateKey(String b64) throws GeneralSecurityException {
        byte[] der = Base64.getDecoder().decode(b64);
        return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(der));
    }

    // JWT-specific helpers
    private static String base64UrlEncode(byte[] data) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(data);
    }

    private static byte[] base64UrlDecode(String data) {
        return Base64.getUrlDecoder().decode(data);
    }

    private static boolean isValidJson(String str) {
        try {
            OBJECT_MAPPER.readTree(str);
            return true;
        } catch (JsonProcessingException e) {
            return false;
        }
    }
}