# Building a Symmetric Encryption Service in Spring Boot

## What is Symmetric Encryption?

Symmetric encryption is a cryptographic technique that uses a **single secret key** for both encryption and decryption. Unlike asymmetric encryption, the same key that encrypts the data is also used to decrypt it. This makes it much faster than asymmetric encryption, but requires both parties to share the secret key securely.

### Why is Symmetric Encryption Used?
- **Speed:** Much faster than asymmetric encryption, making it ideal for encrypting large amounts of data
- **Efficiency:** Less computational overhead, suitable for real-time applications
- **Bulk Data:** Perfect for encrypting files, database records, or streaming data
- **Session Security:** Often used after asymmetric encryption establishes a secure channel

Common algorithms include AES, DES, and ChaCha20. AES (Advanced Encryption Standard) is the most widely used and is considered the gold standard for symmetric encryption.

---

## Building a Symmetric Encryption Service with Spring Boot

Let's create a comprehensive symmetric encryption service using AES-GCM (Galois/Counter Mode) with PBKDF2 key derivation. This combination provides both security and authentication.

### Step 1: Create the Spring Boot Service

First, let's create a service class annotated with `@Service`:

```java
@Service
public class SymmetricCryptoService {

    private static final SecureRandom RNG = new SecureRandom();
    private static final int SALT_BYTES = 16;
    private static final int IV_BYTES = 12;
    private static final int GCM_TAG_BITS = 128;
    private static final int PBKDF2_ITERS = 100_000;
    private static final int AES_BITS = 256;

    public record SymmetricBundle(String secretB64, String saltB64) {}
    public record CipherPack(String ivB64, String cipherB64) {}
```

**What do these constants mean?**

- **SALT_BYTES = 16**: A salt adds randomness to prevent rainbow table attacks. 16 bytes (128 bits) is a secure standard size.

- **IV_BYTES = 12**: IV (Initialization Vector) ensures the same plaintext produces different ciphertexts each time. 12 bytes is the standard for AES-GCM.

- **GCM_TAG_BITS = 128**: GCM mode adds authentication - it can detect if someone tampered with your encrypted data. 128 bits provides strong authentication.

- **PBKDF2_ITERS = 100,000**: This is how many times we stretch the password to make it harder to crack. 100,000 iterations is currently recommended.

- **AES_BITS = 256**: The key size - 256 bits is the strongest standard AES key size, virtually unbreakable with current technology.

### Step 2: Implement Key Generation

Generate a random secret key and salt for AES encryption:

```java
/** Generate a random AES secret + random salt */
public SymmetricBundle generateSymmetricBundle() {
    byte[] secret = randomBytes(32); // 256-bit secret
    byte[] salt = randomBytes(SALT_BYTES);
    return new SymmetricBundle(
            Base64.getEncoder().encodeToString(secret),
            Base64.getEncoder().encodeToString(salt)
    );
}
```

**What's happening here?**

- **32 bytes = 256 bits**: We generate a strong random secret that will be used as the basis for our AES key
- **Random salt**: Each key generation gets a unique salt, making every key derivation different
- **Base64 encoding**: Converts binary data to text for safe storage and transmission

### Step 3: Implement Encryption

Now let's add AES-GCM encryption functionality:

```java
/** Encrypt plaintext using AES-GCM (PBKDF2 from secret+salt) */
public CipherPack encrypt(String plaintext, String secretB64, String saltB64) throws GeneralSecurityException {
    byte[] iv = randomBytes(IV_BYTES);
    SecretKey aesKey = deriveAesKey(secretB64, saltB64);
    Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
    c.init(Cipher.ENCRYPT_MODE, aesKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
    byte[] out = c.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
    return new CipherPack(
            Base64.getEncoder().encodeToString(iv),
            Base64.getEncoder().encodeToString(out)
    );
}
```

**What's AES-GCM?**

- **AES**: Advanced Encryption Standard - the most trusted symmetric encryption algorithm
- **GCM**: Galois/Counter Mode - provides both encryption and authentication in one step
- **NoPadding**: GCM mode doesn't need padding, making it more efficient

### Step 4: Implement Decryption

Add the corresponding decryption functionality:

```java
/** Decrypt AES-GCM ciphertext */
public String decrypt(CipherPack pack, String secretB64, String saltB64) throws GeneralSecurityException {
    SecretKey aesKey = deriveAesKey(secretB64, saltB64);
    Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
    c.init(Cipher.DECRYPT_MODE, aesKey, new GCMParameterSpec(GCM_TAG_BITS, Base64.getDecoder().decode(pack.ivB64())));
    byte[] plain = c.doFinal(Base64.getDecoder().decode(pack.cipherB64()));
    return new String(plain, StandardCharsets.UTF_8);
}
```

### Step 5: Add Helper Methods

Create helper methods for key derivation and random generation:

```java
// Generate random bytes
private static byte[] randomBytes(int n) {
    byte[] b = new byte[n];
    RNG.nextBytes(b);
    return b;
}

// Derive AES key from secret and salt using PBKDF2
private static SecretKey deriveAesKey(String secretB64, String saltB64) throws GeneralSecurityException {
    byte[] secret = Base64.getDecoder().decode(secretB64);
    byte[] salt = Base64.getDecoder().decode(saltB64);
    // Convert bytes to hex string (for compatibility)
    char[] passwordChars = HexFormat.of().formatHex(secret).toCharArray();
    PBEKeySpec spec = new PBEKeySpec(passwordChars, salt, PBKDF2_ITERS, AES_BITS);
    SecretKeyFactory skf = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
    byte[] key = skf.generateSecret(spec).getEncoded();
    return new SecretKeySpec(key, "AES");
}
```

**Helper method explanations:**

- **PBKDF2**: Password-Based Key Derivation Function - stretches your secret through many iterations to make it much harder to crack
- **HexFormat**: Converts binary data to hexadecimal text format for processing
- **SecretKeySpec**: Tells Java this is an AES key ready for encryption/decryption

### Step 6: Create a REST Controller (Optional)

To expose this service via REST API:

```java
@RestController
@RequestMapping("/api/crypto/symmetric")
public class SymmetricCryptoController {
    
    private final SymmetricCryptoService cryptoService;
    
    public SymmetricCryptoController(SymmetricCryptoService cryptoService) {
        this.cryptoService = cryptoService;
    }
    
    @PostMapping("/generate-key")
    public SymmetricBundle generateKey() {
        return cryptoService.generateSymmetricBundle();
    }
    
    @PostMapping("/encrypt")
    public CipherPack encrypt(@RequestBody EncryptRequest request) throws GeneralSecurityException {
        return cryptoService.encrypt(request.plaintext(), request.secret(), request.salt());
    }
    
    @PostMapping("/decrypt")
    public String decrypt(@RequestBody DecryptRequest request) throws GeneralSecurityException {
        return cryptoService.decrypt(request.cipherPack(), request.secret(), request.salt());
    }
    
    public record EncryptRequest(String plaintext, String secret, String salt) {}
    public record DecryptRequest(CipherPack cipherPack, String secret, String salt) {}
}
```

### Step 7: Usage Example

Here's how you would use this service in your Spring Boot application:

```java
@Component
public class SymmetricCryptoExample {
    
    private final SymmetricCryptoService cryptoService;
    
    public SymmetricCryptoExample(SymmetricCryptoService cryptoService) {
        this.cryptoService = cryptoService;
    }
    
    public void demonstrateEncryption() throws GeneralSecurityException {
        // 1. Generate secret key and salt
        SymmetricBundle bundle = cryptoService.generateSymmetricBundle();
        
        // 2. Encrypt some data
        String plaintext = "Hello, symmetric world!";
        CipherPack encrypted = cryptoService.encrypt(plaintext, bundle.secretB64(), bundle.saltB64());
        
        // 3. Decrypt the data
        String decrypted = cryptoService.decrypt(encrypted, bundle.secretB64(), bundle.saltB64());
        
        System.out.println("Original: " + plaintext);
        System.out.println("Encrypted IV: " + encrypted.ivB64());
        System.out.println("Encrypted Data: " + encrypted.cipherB64());
        System.out.println("Decrypted: " + decrypted);
    }
}
```

### Key Security Features

**Why these choices matter:**

- **AES-256**: This is like having a combination lock with 2^256 possible combinations - that's more combinations than there are atoms in the observable universe!

- **GCM Mode**: This is like having a tamper-evident seal on your package. Not only does it encrypt your data, but it also tells you if anyone tried to modify it.

- **PBKDF2 with 100,000 iterations**: Think of this as running your password through a blender 100,000 times. Even if someone gets your encrypted data, they'd need massive computing power and time to crack it.

- **Random IV for each encryption**: Like using a different lock combination every time you encrypt something, even the same message will look completely different when encrypted.

- **Separate IV storage**: The IV doesn't need to be secret, just unique. Storing it separately ensures each encryption operation is unique.

### When to Use Symmetric vs Asymmetric

- **Use Symmetric when:** You need to encrypt large amounts of data quickly, or when you can safely share the secret key
- **Use Asymmetric when:** You need to communicate with someone without sharing a secret beforehand, or for digital signatures
- **Use Both together:** Many systems use asymmetric encryption to share a symmetric key, then use symmetric encryption for the actual data (like HTTPS)

This implementation provides a robust, fast, and secure foundation for symmetric encryption in your Spring Boot applications.
