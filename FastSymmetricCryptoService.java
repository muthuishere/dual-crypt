package experiments.muthuishere.dualcrypt.crypto.symmeetric;

import org.springframework.stereotype.Service;

import javax.crypto.*;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class FastSymmetricCryptoService {

    private static final SecureRandom RNG = new SecureRandom();
    private static final int SALT_BYTES = 16;
    private static final int IV_BYTES = 12;
    private static final int GCM_TAG_BITS = 128;
    private static final int AES_KEY_BITS = 256;

    public record SymmetricBundle(String secretB64, String saltB64) {}
    public record CipherPack(String ivB64, String cipherB64) {}

    /** Generate a real AES key (like RSA key generation) - FAST! */
    public SymmetricBundle generateSymmetricBundle() throws GeneralSecurityException {
        // Generate a proper AES-256 key (no derivation needed later!)
        KeyGenerator keyGen = KeyGenerator.getInstance("AES");
        keyGen.init(AES_KEY_BITS, RNG);
        SecretKey aesKey = keyGen.generateKey();
        
        byte[] salt = randomBytes(SALT_BYTES);
        
        return new SymmetricBundle(
                Base64.getEncoder().encodeToString(aesKey.getEncoded()),  // Real AES key
                Base64.getEncoder().encodeToString(salt)
        );
    }

    /** Encrypt plaintext using AES-GCM - FAST! No key derivation! */
    public CipherPack encrypt(String plaintext, String secretB64, String saltB64) throws GeneralSecurityException {
        byte[] iv = randomBytes(IV_BYTES);
        SecretKey aesKey = loadAesKey(secretB64);  // Just decode Base64 - FAST!
        
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.ENCRYPT_MODE, aesKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
        byte[] out = c.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
        
        return new CipherPack(
                Base64.getEncoder().encodeToString(iv),
                Base64.getEncoder().encodeToString(out)
        );
    }

    /** Decrypt AES-GCM ciphertext - FAST! */
    public String decrypt(CipherPack pack, String secretB64, String saltB64) throws GeneralSecurityException {
        SecretKey aesKey = loadAesKey(secretB64);  // Just decode Base64 - FAST!
        
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.DECRYPT_MODE, aesKey, new GCMParameterSpec(GCM_TAG_BITS, Base64.getDecoder().decode(pack.ivB64())));
        byte[] plain = c.doFinal(Base64.getDecoder().decode(pack.cipherB64()));
        
        return new String(plain, StandardCharsets.UTF_8);
    }

    // ===== Fast Helpers (like AsymmetricCryptoService) =====
    
    private static byte[] randomBytes(int n) {
        byte[] b = new byte[n];
        RNG.nextBytes(b);
        return b;
    }

    /** Load AES key directly from Base64 (like RSA key loading) */
    private static SecretKey loadAesKey(String keyB64) throws GeneralSecurityException {
        byte[] keyBytes = Base64.getDecoder().decode(keyB64);
        
        // Validate key size
        if (keyBytes.length != 32) {  // 256 bits = 32 bytes
            throw new IllegalArgumentException("AES key must be exactly 32 bytes (256-bit)");
        }
        
        return new SecretKeySpec(keyBytes, "AES");
    }
}
