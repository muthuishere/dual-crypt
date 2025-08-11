// src/services/TemplateService.js
const MODE_MAP = { browser: 'js', server: 'spring_boot' };
const MODE_LABEL = { browser: 'JavaScript (Browser)', server: 'Spring Boot (Server)' };

// Load all markdown files
const RAW_TEMPLATES = import.meta.glob('../templates/*.md', { query: '?raw', import: 'default', eager: true });

function tplPath(type, op, mode) {
  const normalizedOp = op === 'generate' ? 'generate-keys' : op;
  return `../templates/${type}-${normalizedOp}_${MODE_MAP[mode]}.md`;
}

function loadTemplate(type, operation, mode) {
  const path = tplPath(type, operation, mode);
  if (!RAW_TEMPLATES[path]) {
    throw new Error(`Template not found: ${path}`);
  }
  return RAW_TEMPLATES[path];
}

function combineSections(sections) {
  return sections
    .map(
      ({ title, content }) =>
        `## ${title}\n\n${content.trim()}\n`
    )
    .join('\n');
}

export const templateService = {
  /** Symmetric single op */
  async getSymmetericTemplate(operation, mode) {
    return loadTemplate('symmetric', operation, mode);
  },

  /** Symmetric full explanation as a single markdown string */
  async getSymmetricFullExplanation(generateMode, encryptMode, decryptMode) {
    const modeIcons = { browser: '🌐', server: '☁️' };
    const operationIcons = { generate: '🔑', encrypt: '�', decrypt: '🔓' };
    
    // Create flow header
    const flowHeader = {
      title: '🔄 Complete Symmetric Crypto Flow',
      content: `
> **Cross-Platform Workflow:** ${operationIcons.generate} ${modeIcons[generateMode]} **Generate** → ${operationIcons.encrypt} ${modeIcons[encryptMode]} **Encrypt** → ${operationIcons.decrypt} ${modeIcons[decryptMode]} **Decrypt**

### 🎯 Workflow Overview

| Step | Platform | Operation | Description |
|------|----------|-----------|-------------|
| 1️⃣ | ${modeIcons[generateMode]} ${MODE_LABEL[generateMode]} | ${operationIcons.generate} Generate Keys | Create secure AES-256 keys and salt |
| 2️⃣ | ${modeIcons[encryptMode]} ${MODE_LABEL[encryptMode]} | ${operationIcons.encrypt} Encrypt Data | Encrypt plaintext using generated keys |
| 3️⃣ | ${modeIcons[decryptMode]} ${MODE_LABEL[decryptMode]} | ${operationIcons.decrypt} Decrypt Data | Recover original plaintext |

**🔐 Security:** AES-256-GCM with HKDF-SHA256 key derivation ensures maximum security across platforms.

---
`
    };
    
    const sections = [
      flowHeader,
      {
        title: `${operationIcons.generate} Generate Keys — ${modeIcons[generateMode]} ${MODE_LABEL[generateMode]}`,
        content: loadTemplate('symmetric', 'generate-keys', generateMode),
      },
      {
        title: `${operationIcons.encrypt} Encrypt — ${modeIcons[encryptMode]} ${MODE_LABEL[encryptMode]}`,
        content: loadTemplate('symmetric', 'encrypt', encryptMode),
      },
      {
        title: `${operationIcons.decrypt} Decrypt — ${modeIcons[decryptMode]} ${MODE_LABEL[decryptMode]}`,
        content: loadTemplate('symmetric', 'decrypt', decryptMode),
      },
    ];
    return combineSections(sections);
  },

  /** Asymmetric single op */
  async getAsymmetricTemplate(operation, mode) {
    return loadTemplate('asymmetric', operation, mode);
  },

  /** Asymmetric full explanation as a single markdown string */
  async getAsymmetricFullExplanation(generateMode, encryptMode, decryptMode) {
    const modeIcons = { browser: '🌐', server: '☁️' };
    const operationIcons = { generate: '🔑', encrypt: '�', decrypt: '🔓' };
    
    // Create flow header
    const flowHeader = {
      title: '🔄 Complete Asymmetric Crypto Flow',
      content: `
> **Cross-Platform Workflow:** ${operationIcons.generate} ${modeIcons[generateMode]} **Generate** → ${operationIcons.encrypt} ${modeIcons[encryptMode]} **Encrypt** → ${operationIcons.decrypt} ${modeIcons[decryptMode]} **Decrypt**

### 🎯 Workflow Overview

| Step | Platform | Operation | Description |
|------|----------|-----------|-------------|
| 1️⃣ | ${modeIcons[generateMode]} ${MODE_LABEL[generateMode]} | ${operationIcons.generate} Generate Keys | Create RSA-2048 keypair (public + private) |
| 2️⃣ | ${modeIcons[encryptMode]} ${MODE_LABEL[encryptMode]} | ${operationIcons.encrypt} Encrypt Data | Encrypt with public key using RSA-OAEP |
| 3️⃣ | ${modeIcons[decryptMode]} ${MODE_LABEL[decryptMode]} | ${operationIcons.decrypt} Decrypt Data | Decrypt with private key |

**🔐 Security:** RSA-2048 with OAEP-SHA256 padding provides strong asymmetric encryption across platforms.

---
`
    };
    
    const sections = [
      flowHeader,
      {
        title: `${operationIcons.generate} Generate Keys — ${modeIcons[generateMode]} ${MODE_LABEL[generateMode]}`,
        content: loadTemplate('asymmetric', 'generate-keys', generateMode),
      },
      {
        title: `${operationIcons.encrypt} Encrypt — ${modeIcons[encryptMode]} ${MODE_LABEL[encryptMode]}`,
        content: loadTemplate('asymmetric', 'encrypt', encryptMode),
      },
      {
        title: `${operationIcons.decrypt} Decrypt — ${modeIcons[decryptMode]} ${MODE_LABEL[decryptMode]}`,
        content: loadTemplate('asymmetric', 'decrypt', decryptMode),
      },
    ];
    return combineSections(sections);
  },
};
