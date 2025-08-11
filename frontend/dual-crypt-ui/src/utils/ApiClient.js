// src/utils/ApiClient.js
import API_CONFIG from '../config/api.js';

export default class ApiClient {
  constructor() {
    // No JSON baseline tracking
  }

  /**
   * Generic fetch JSON data - useful for validation
   */
  async fetchJson({ method = 'GET', url, headers = {}, body = null }) {
    const requestConfig = {
      method,
      headers: {
        'Accept': API_CONFIG.FORMATS.JSON,
        'Content-Type': API_CONFIG.FORMATS.JSON,
        ...headers
      },
      ...(body && { body: typeof body === 'string' ? body : JSON.stringify(body) })
    };
    
    const response = await fetch(url, requestConfig);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Generic fetch and parse data with full HTTP request control
   * Always returns deserializedData regardless of format
   */
  async fetchAndParse({ 
    method = 'GET', 
    url, 
    headers = {}, 
    body = null, 
    format, 
    protoService = null
  }) {
    const clientStartTime = performance.now();
    
    // === NETWORK REQUEST ===
    const networkStartTime = performance.now();
    
    const requestConfig = {
      method,
      headers,
      ...(body && { body })
    };
    
    const response = await fetch(url, requestConfig);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const networkEndTime = performance.now();
    const networkTime = Math.round(networkEndTime - networkStartTime);
    
    // Extract server-side timing from headers
    const serializeTime = response.headers.get('X-Serialize-Time-Ms');
    const serverTotalTime = response.headers.get('X-Server-Total-Time-Ms');
    const serializeTimeMs = serializeTime ? parseInt(serializeTime) : null;
    const serverTotalTimeMs = serverTotalTime ? parseInt(serverTotalTime) : null;
    
    // === DESERIALIZATION ===
    const deserializeStartTime = performance.now();
    let data;
    let dataSize;
    let deserializedData = null;
    
    if (format === API_CONFIG.FORMATS.JSON) {
      data = await response.json();
      deserializedData = data;
      dataSize = new Blob([JSON.stringify(data)]).size;
      
    } else if (format === API_CONFIG.FORMATS.PROTOBUF) {
      const arrayBuffer = await response.arrayBuffer();
      data = arrayBuffer;
      dataSize = arrayBuffer.byteLength;
      
      // Use protobuf service to deserialize
      if (protoService && protoService.parseArray) {
        deserializedData = await protoService.parseArray(arrayBuffer);
      } else if (parser && typeof parser === 'function') {
        deserializedData = await parser(arrayBuffer);
      } else {
        throw new Error('ProtoService or parser required for protobuf format');
      }
      
    } else if (format === API_CONFIG.FORMATS.CBOR || format === API_CONFIG.FORMATS.MSGPACK) {
      const arrayBuffer = await response.arrayBuffer();
      data = arrayBuffer;
      dataSize = arrayBuffer.byteLength;
      
      // For CBOR/MessagePack, we'll return the raw data and let the consumer handle parsing
      // In a real implementation, you'd add cbor-js or msgpack libraries here
      deserializedData = null; // Consumer needs to parse this format
      
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }
    
    const deserializeEndTime = performance.now();
    const clientDeserializeTime = Math.round(deserializeEndTime - deserializeStartTime);
    
    // === CALCULATE TIMINGS ===
    const clientEndTime = performance.now();
    const clientTotalTime = Math.round(clientEndTime - clientStartTime);
    const endToEndTime = clientTotalTime;
    const actualNetworkTime = networkTime - (serverTotalTimeMs || 0);
    
    // === CALCULATE METRICS ===
    const metrics = this._calculateMetrics({
      networkTime: actualNetworkTime,
      clientDeserializeTime,
      clientTotalTime,
      serverSerializeTime: serializeTimeMs,
      serverTotalTime: serverTotalTimeMs,
      endToEndTime,
      dataSize,
      format
    });
    
    return {
      success: true,
      data,
      deserializedData, // Always populated regardless of format
      dataSize,
      metrics,
      timingData: {
        networkTime: actualNetworkTime,
        clientDeserializeTime,
        clientTotalTime,
        serverSerializeTime: serializeTimeMs,
        serverTotalTime: serverTotalTimeMs,
        endToEndTime
      },
      headers: Object.fromEntries(response.headers.entries()),
      request: {
        method,
        url,
        headers: requestConfig.headers,
        body
      }
    };
  }

  /**
   * Calculate performance metrics
   */
  _calculateMetrics({ networkTime, clientDeserializeTime, clientTotalTime, serverSerializeTime, serverTotalTime, endToEndTime, dataSize, format }) {
    // Calculate throughput (KB/s)
    const throughput = endToEndTime > 0 ? ((dataSize / 1024) / (endToEndTime / 1000)) : 0;

    return {
      networkTime: networkTime || 0,
      clientDeserializeTime: clientDeserializeTime || 0,
      clientTotalTime: clientTotalTime || 0,
      serverSerializeTime: serverSerializeTime || 0,
      serverTotalTime: serverTotalTime || 0,
      endToEndTime: endToEndTime || 0,
      dataSize,
      throughput,
      format
    };
  }

  /**
   * Helper methods for common operations
   */
  static getDebugHeaders(headers) {
    const debugInfo = {};
    for (const [key, value] of Object.entries(headers)) {
      debugInfo[key] = value;
    }
    return debugInfo;
  }

  static formatTimingBreakdown(timingData) {
    const { serverSerializeTime, serverTotalTime, networkTime, clientDeserializeTime, endToEndTime } = timingData;
    
    const lines = [];
    if (serverSerializeTime !== null && serverTotalTime !== null) {
      const serverProcessingTime = serverTotalTime - serverSerializeTime;
      lines.push(`Server Processing: ${serverProcessingTime}ms`);
      lines.push(`Server Serialization: ${serverSerializeTime}ms`);
      lines.push(`Network Transfer: ${networkTime}ms`);
      lines.push(`Client Deserialization: ${clientDeserializeTime}ms`);
      lines.push(`═══════════════════════════════`);
      lines.push(`End-to-End Total: ${endToEndTime}ms`);
    }
    return lines;
  }
}
