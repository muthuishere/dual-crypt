# Building an Asymmetric Encryption Service in Spring Boot

## What is Asymmetric Encryption?

Asymmetric encryption, also known as public-key cryptography, is a cryptographic technique that uses a pair of keys: a **public key** and a **private key**. Data encrypted with one key can only be decrypted with the other. Typically, the public key is shared openly, while the private key is kept secret.

### Why is Asymmetric Encryption Used?
- **Secure Communication:** It allows two parties to communicate securely without sharing a secret key in advance.
- **Authentication:** It can verify the identity of a sender (digital signatures).
- **Key Exchange:** It is often used to securely exchange symmetric keys for faster encryption.

Common algorithms include RSA, DSA, and ECC. Asymmetric encryption is foundational for protocols like HTTPS, SSH, and digital signatures.

---

## Building an Asymmetric Encryption Service with Spring Boot

Let's create a comprehensive asymmetric encryption service that can generate RSA key pairs, encrypt data, and decrypt data. We'll use modern security practices with RSA-OAEP and SHA-256.

### Step 1: Create the Spring Boot Service

First, let's create a service class annotated with `@Service` to make it a Spring-managed bean:

```java
@Service
public class AsymmetricCryptoService {
    
    private static final SecureRandom RNG = new SecureRandom();
    private static final int RSA_BITS = 2048;
    private static final int SALT_BYTES = 16;
    
    // Record to bundle keys and salt together
    public record RsaBundle(String publicKeyB64, String privateKeyB64, String saltB64) {}
```

**What do these constants mean?**

- **RSA_BITS = 2048**: This is the key size in bits. Think of it as the "strength" of your encryption. 2048 bits is the current standard - it's strong enough to be secure but not so large that it's slow. Larger numbers = more secure but slower performance.

- **SALT_BYTES = 16**: A salt is random data that adds extra security. 16 bytes (128 bits) is a good standard size. It's like adding extra randomness to make your encryption unique each time.

- **SecureRandom**: This generates truly random numbers for cryptographic purposes, not the predictable "random" numbers used in games.

### Step 2: Implement Key Generation

The first functionality we need is to generate RSA key pairs. We'll create 2048-bit keys for good security:

```java
/** Generate RSA keypair + random salt */
public RsaBundle generateRsaBundle() throws GeneralSecurityException {
    KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
    kpg.initialize(RSA_BITS, RNG);
    KeyPair kp = kpg.generateKeyPair();
    
    // Generate random salt for additional security operations
    byte[] salt = new byte[SALT_BYTES];
    RNG.nextBytes(salt);

    return new RsaBundle(
            Base64.getEncoder().encodeToString(kp.getPublic().getEncoded()),
            Base64.getEncoder().encodeToString(kp.getPrivate().getEncoded()),
            Base64.getEncoder().encodeToString(salt)
    );
}
```

**What's happening here?**

- **KeyPairGenerator**: This creates a pair of keys (public and private) that work together
- **Base64 encoding**: Converts the binary key data into text that's safe to store and send over the internet
- **X.509/SPKI format (public key)**: This is a standard way to store public keys that everyone agrees on - like a universal format for public keys
- **PKCS#8 format (private key)**: This is the standard way to store private keys safely

### Step 3: Implement Encryption

Now let's add encryption functionality using RSA-OAEP with SHA-256:

```java
/** Encrypt plaintext with RSA-OAEP SHA-256 public key */
public String encrypt(String plaintext, String publicKeyB64) throws GeneralSecurityException {
    PublicKey pub = loadPublicKey(publicKeyB64);
    Cipher c = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
    c.init(Cipher.ENCRYPT_MODE, pub, oaep256());
    byte[] out = c.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
    return Base64.getEncoder().encodeToString(out);
}
```

**What's RSA-OAEP with SHA-256?**

- **OAEP**: Optimal Asymmetric Encryption Padding - it's like adding protective wrapping around your data to make it more secure
- **SHA-256**: A secure hashing algorithm that creates a unique "fingerprint" of data - it's very hard to fake or reverse

### Step 4: Implement Decryption

Add the corresponding decryption functionality:

```java
/** Decrypt ciphertext with RSA-OAEP SHA-256 private key */
public String decrypt(String cipherB64, String privateKeyB64) throws GeneralSecurityException {
    PrivateKey prv = loadPrivateKey(privateKeyB64);
    Cipher c = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
    c.init(Cipher.DECRYPT_MODE, prv, oaep256());
    byte[] plain = c.doFinal(Base64.getDecoder().decode(cipherB64));
    return new String(plain, StandardCharsets.UTF_8);
}
```

### Step 5: Add Helper Methods

Create helper methods for key loading and OAEP configuration:

```java
// Configure OAEP padding with SHA-256
private static OAEPParameterSpec oaep256() {
    return new OAEPParameterSpec("SHA-256", "MGF1", MGF1ParameterSpec.SHA256, PSource.PSpecified.DEFAULT);
}

// Load public key from Base64 string
private static PublicKey loadPublicKey(String b64) throws GeneralSecurityException {
    byte[] der = Base64.getDecoder().decode(b64);
    return KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(der));
}

// Load private key from Base64 string
private static PrivateKey loadPrivateKey(String b64) throws GeneralSecurityException {
    byte[] der = Base64.getDecoder().decode(b64);
    return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(der));
}
```

**Helper method explanations:**

- **loadPublicKey/loadPrivateKey**: These convert Base64 text back into actual key objects that Java can use for encryption/decryption
- **X509EncodedKeySpec/PKCS8EncodedKeySpec**: These tell Java what format the key is in, so it knows how to read it properly

### Step 6: Create a REST Controller (Optional)

To expose this service via REST API, create a controller:

```java
@RestController
@RequestMapping("/api/crypto/asymmetric")
public class AsymmetricCryptoController {
    
    private final AsymmetricCryptoService cryptoService;
    
    public AsymmetricCryptoController(AsymmetricCryptoService cryptoService) {
        this.cryptoService = cryptoService;
    }
    
    @PostMapping("/generate-keys")
    public RsaBundle generateKeys() throws GeneralSecurityException {
        return cryptoService.generateRsaBundle();
    }
    
    @PostMapping("/encrypt")
    public String encrypt(@RequestBody EncryptRequest request) throws GeneralSecurityException {
        return cryptoService.encrypt(request.plaintext(), request.publicKey());
    }
    
    @PostMapping("/decrypt")
    public String decrypt(@RequestBody DecryptRequest request) throws GeneralSecurityException {
        return cryptoService.decrypt(request.ciphertext(), request.privateKey());
    }
    
    public record EncryptRequest(String plaintext, String publicKey) {}
    public record DecryptRequest(String ciphertext, String privateKey) {}
}
```

### Step 7: Usage Example

Here's how you would use this service in your Spring Boot application:

```java
@Component
public class CryptoExample {
    
    private final AsymmetricCryptoService cryptoService;
    
    public CryptoExample(AsymmetricCryptoService cryptoService) {
        this.cryptoService = cryptoService;
    }
    
    public void demonstrateEncryption() throws GeneralSecurityException {
        // 1. Generate key pair
        RsaBundle bundle = cryptoService.generateRsaBundle();
        
        // 2. Encrypt some data
        String plaintext = "Hello, secure world!";
        String ciphertext = cryptoService.encrypt(plaintext, bundle.publicKeyB64());
        
        // 3. Decrypt the data
        String decrypted = cryptoService.decrypt(ciphertext, bundle.privateKeyB64());
        
        System.out.println("Original: " + plaintext);
        System.out.println("Encrypted: " + ciphertext);
        System.out.println("Decrypted: " + decrypted);
    }
}
```

### Key Security Features

**Why these choices matter:**

- **2048-bit RSA keys:** This is like having a lock with 2048 different combinations. It's strong enough that even powerful computers would take many years to break it.

- **OAEP padding with SHA-256:** Think of this as gift wrapping for your data - it adds protective layers that make it much harder for attackers to figure out patterns or break the encryption.

- **Base64 encoding:** This converts your encrypted data into text that's safe to send in emails, store in databases, or transmit over the internet without getting corrupted.

- **Standard key formats:** Using X.509 and PKCS#8 means your keys will work with other security tools and systems - it's like using standard electrical plugs that work anywhere.

This implementation provides a robust foundation for asymmetric encryption in your Spring Boot applications, following current security best practices.
