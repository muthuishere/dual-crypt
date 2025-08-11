# The Dual-Crypt Project: A Complete Cryptography & Serialization System

## What is Dual-Crypt?

Dual-Crypt is a comprehensive **Spring Boot application** that demonstrates both **cryptographic security** and **data serialization performance**. It's actually two systems in one:

1. **🔐 Cryptography System:** Provides both symmetric and asymmetric encryption services
2. **📊 Serialization Benchmarking System:** Tests and compares different data serialization formats for performance

Think of it as a **crypto security toolkit** combined with a **performance testing laboratory** - all wrapped up in a modern web application with a sleek React frontend.

---

## High-Level Architecture

### Backend (Spring Boot)
The backend is built with **Java Spring Boot** and provides:
- **RESTful APIs** for encryption/decryption operations
- **Performance testing endpoints** for serialization benchmarks
- **Secure cryptographic services** using industry-standard algorithms
- **Real-time metrics** and timing data

### Frontend (React + Vite)
The frontend is a **modern React application** that provides:
- **Interactive testing interfaces** for trying out encryption
- **Performance visualization** with charts and graphs
- **Real-time feedback** and detailed analytics
- **User-friendly controls** for configuring tests

### Key Technologies Used
- **Backend:** Spring Boot, Java Cryptography APIs, Jackson, MessagePack, CBOR, Protocol Buffers
- **Frontend:** React, Vite, Tailwind CSS, Recharts (for visualizations)
- **Build Tools:** Gradle (backend), Bun (frontend)

---

## Available API Endpoints

The application provides two main sets of APIs:

### 🔒 Cryptography APIs

#### Asymmetric Encryption (RSA)
**Base URL:** `/api/asymmetric`

- **`GET /generate`** - Generate a new RSA key pair (2048-bit) with salt
  ```json
  Response: {
    "publicKeyB64": "base64-encoded-public-key",
    "privateKeyB64": "base64-encoded-private-key", 
    "saltB64": "base64-encoded-salt"
  }
  ```

- **`POST /encrypt`** - Encrypt data with RSA public key
  ```json
  Request: {
    "plaintext": "Hello, World!",
    "publicKeyB64": "your-public-key-here"
  }
  Response: {
    "text": "base64-encrypted-data"
  }
  ```

- **`POST /decrypt`** - Decrypt data with RSA private key
  ```json
  Request: {
    "cipherB64": "encrypted-data-here",
    "privateKeyB64": "your-private-key-here"
  }
  Response: {
    "text": "Hello, World!"
  }
  ```

#### Symmetric Encryption (AES)
**Base URL:** `/api/symmetric`

- **`GET /generate`** - Generate a new AES secret key and salt
  ```json
  Response: {
    "secretB64": "base64-encoded-256-bit-key",
    "saltB64": "base64-encoded-salt"
  }
  ```

- **`POST /encrypt`** - Encrypt data with AES-GCM
  ```json
  Request: {
    "plaintext": "Hello, World!",
    "secretB64": "your-secret-key-here",
    "saltB64": "your-salt-here"
  }
  Response: {
    "ivB64": "base64-initialization-vector",
    "cipherB64": "base64-encrypted-data"
  }
  ```

- **`POST /decrypt`** - Decrypt AES-GCM data
  ```json
  Request: {
    "ivB64": "initialization-vector-here",
    "cipherB64": "encrypted-data-here",
    "secretB64": "your-secret-key-here",
    "saltB64": "your-salt-here"
  }
  Response: {
    "text": "Hello, World!"
  }
  ```

### 📊 Serialization Performance APIs

#### Product Generation & Testing
**Base URL:** `/api/products`

- **`GET /products?count=100`** - Generate test data in various formats
  - **Formats supported:** JSON, MessagePack, CBOR, Protocol Buffers
  - **Content-Type header** determines the format:
    - `application/json` → JSON format
    - `application/x-msgpack` → MessagePack format  
    - `application/cbor` → CBOR format
    - `application/x-protobuf` → Protocol Buffers format

- **Response includes timing headers:**
  - `X-Server-Serialize-Time-Ms` - Time spent serializing on server
  - `X-Server-Total-Time-Ms` - Total server processing time

---

## What Makes This System Special?

### 🛡️ Security Features

**Modern Cryptographic Standards:**
- **RSA-2048 with OAEP padding** - Quantum-resistant for the foreseeable future
- **AES-256-GCM** - Military-grade symmetric encryption with authentication
- **PBKDF2 with 100,000 iterations** - Protects against brute force attacks
- **Secure random generation** - All keys and salts use cryptographically secure randomness

### ⚡ Performance Focus

**Real-time Benchmarking:**
- **Multiple serialization formats** - Compare JSON, MessagePack, CBOR, Protocol Buffers
- **Detailed timing metrics** - Network time, serialization time, deserialization time
- **Throughput calculations** - KB/s performance measurements
- **Size comparisons** - Compression ratios and space efficiency

### 🎨 User Experience

**Interactive Frontend:**
- **Live testing interface** - Try encryption/decryption in real-time
- **Performance visualization** - Charts and graphs show timing breakdowns
- **Detailed insights** - AI-powered recommendations for optimization
- **Responsive design** - Works on desktop and mobile

---

## Real-World Applications

### For Developers
- **Learn cryptography** by experimenting with real implementations
- **Performance testing** - Compare serialization formats for your projects
- **Security reference** - See how to implement encryption correctly
- **API examples** - Copy patterns for your own applications

### For DevOps/Performance Teams
- **Benchmark serialization** formats for microservices
- **Measure network efficiency** and data compression
- **Test encryption overhead** in your pipeline
- **Capacity planning** with real performance data

### For Security Teams
- **Verify encryption** implementations follow best practices
- **Test key management** workflows
- **Validate data protection** in transit and at rest
- **Educational tool** for security training

---

## Getting Started

### Running the Application

1. **Backend (Spring Boot):**
   ```bash
   ./gradlew bootRun
   ```
   Server runs on `http://localhost:8080`

2. **Frontend (React):**
   ```bash
   cd frontend/dual-crypt-ui
   bun install
   bun dev
   ```
   UI available on `http://localhost:5173`

### Quick Test Examples

**Try Symmetric Encryption:**
```bash
# Generate keys
curl http://localhost:8080/api/symmetric/generate

# Encrypt data
curl -X POST http://localhost:8080/api/symmetric/encrypt \
  -H "Content-Type: application/json" \
  -d '{"plaintext":"Hello!", "secretB64":"your-key", "saltB64":"your-salt"}'
```

**Test Serialization Performance:**
```bash
# Get JSON data
curl http://localhost:8080/api/products?count=1000 \
  -H "Accept: application/json"

# Get MessagePack data  
curl http://localhost:8080/api/products?count=1000 \
  -H "Accept: application/x-msgpack"
```

---

## The Bottom Line

Dual-Crypt is like having a **cryptography playground** and **performance lab** in one package. Whether you're:

- **Learning about encryption** and want to see it work
- **Optimizing data transfer** and need to compare formats  
- **Building secure applications** and want proven patterns
- **Teaching security concepts** with hands-on examples

This system provides the tools, APIs, and insights to get the job done. It's production-ready cryptography with developer-friendly interfaces, all wrapped up in a beautiful, interactive web application.

**Perfect for:** Security engineers, backend developers, performance testers, and anyone curious about how modern cryptography and data serialization actually work in practice!
