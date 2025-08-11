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

    private static final SecureRandom RNG = new SecureRandom();
    private static final int RSA_BITS = 2048;
    private static final int SALT_BYTES = 16;

    // For RSA-2048 with OAEP-SHA256: 256 - 2*32 - 2 = 190 bytes
    private static final int MAX_PLAINTEXT_BYTES = (RSA_BITS / 8) - 2 * 32 - 2;

    public record RsaBundle(String publicKeyB64, String privateKeyB64, String saltB64) {}

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
}