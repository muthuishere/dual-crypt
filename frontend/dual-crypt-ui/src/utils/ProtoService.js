// src/utils/ProtoService.js
import protobuf from 'protobufjs';
import API_CONFIG from '../config/api';

export default class ProtoService {
    constructor(protoUrl = '/assets/Product.proto', messageTypeName = 'experiments.muthuishere.dualcrypt.products.Product') {
        this.protoUrl = protoUrl;
        this.messageTypeName = messageTypeName;
        this.rootPromise = null;
    }

    /**
     * Load the proto file for this instance
     */
    async loadProto() {
        if (!this.rootPromise) {
            this.rootPromise = protobuf
                .load(this.protoUrl)
                .then(root => {
                    root.resolveAll();
                    return root;
                });
        }
        return this.rootPromise;
    }



    /**
     * Parse a single protobuf message from buffer
     */
    async parse(buffer) {
        try {
            const root = await this.loadProto();
            const MessageType = root.lookupType(this.messageTypeName);
            
            const uint8Array = new Uint8Array(buffer);
            const msg = MessageType.decode(uint8Array);
            const obj = MessageType.toObject(msg, {
                longs: Number,
                enums: String,
                defaults: true
            });
            
            return obj;
        } catch (error) {
            throw new Error(`Failed to parse protobuf data: ${error.message}`);
        }
    }

    /**
     * Parse multiple length-prefixed protobuf messages from buffer
     */
    async parseArray(buffer) {
        try {
            const root = await this.loadProto();
            const MessageType = root.lookupType(this.messageTypeName);
            
            const messages = [];
            const uint8Array = new Uint8Array(buffer);
            let offset = 0;
            
            while (offset < uint8Array.length) {
                const reader = new protobuf.Reader(uint8Array.subarray(offset));
                const length = reader.uint32(); // Read length prefix
                
                if (length > 0 && offset + reader.pos + length <= uint8Array.length) {
                    const messageBytes = uint8Array.subarray(offset + reader.pos, offset + reader.pos + length);
                    const msg = MessageType.decode(messageBytes);
                    const obj = MessageType.toObject(msg, {
                        longs: Number,
                        enums: String,
                        defaults: true
                    });
                    messages.push(obj);
                    offset += reader.pos + length;
                } else {
                    break; // Invalid length or not enough data remaining
                }
            }
            
            return messages;
        } catch (error) {
            throw new Error(`Failed to parse protobuf array data: ${error.message}`);
        }
    }

    /**
     * Helper method to list all available types for debugging
     */
    static listAllTypes(root, prefix = '') {
        function traverse(obj, currentPrefix) {
            if (!obj.nested) return;
            
            for (const [key, value] of Object.entries(obj.nested)) {
                const fullName = currentPrefix ? `${currentPrefix}.${key}` : key;
                
                if (value instanceof protobuf.Type) {
                    console.log(`  - Message: ${fullName}`);
                } else if (value.nested) {
                    console.log(`  - Namespace: ${fullName}`);
                    traverse(value, fullName);
                }
            }
        }
        
        traverse(root, prefix);
    }

    /**
     * Convenience wrapper: fetch & parse in one go
     */
    static async getData(count) {
        const res = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS}?count=${count}`,
            { headers: { Accept: API_CONFIG.FORMATS.MSGPACK /* placeholder */ } }
        );
        // but you’ll override the header in testFormat
        const buf = await res.arrayBuffer();
        return ProtoService.parse(buf);
    }
}
