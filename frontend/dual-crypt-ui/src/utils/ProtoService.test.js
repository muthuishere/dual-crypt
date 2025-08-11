// ProtoService.test.js - Simple E2E test for ProtoService
import { describe, test, expect, beforeAll } from 'bun:test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import ProtoService from './ProtoService';
import API_CONFIG from '../config/api';

const API_BASE_URL = 'http://localhost:8080';
const PRODUCTS_ENDPOINT = '/products';

describe('ProtoService E2E Test', () => {
  let protoService;

  beforeAll(() => {
    // Get the current file's directory and construct path to proto file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const protoPath = join(__dirname, '../../public/assets/Product.proto');
    console.log(`Using proto file at: ${protoPath}`);
    protoService = new ProtoService(protoPath);
  });

  test('should fetch and parse protobuf data for 100 products', async () => {
    const productCount = 100;
    const url = `${API_BASE_URL}${PRODUCTS_ENDPOINT}?count=${productCount}`;
    
    console.log(`🚀 Testing protobuf fetch from: ${url}`);
    
    // Fetch protobuf data
    const response = await fetch(url, {
      headers: {
        'Accept': API_CONFIG.FORMATS.PROTOBUF,
        'Content-Type': 'application/json'
      }
    });
    
    expect(response.ok).toBe(true);
    expect(response.headers.get('content-type')).toBe('application/x-protobuf');
    
    // Get ArrayBuffer and parse
    const arrayBuffer = await response.arrayBuffer();
    expect(arrayBuffer.byteLength).toBeGreaterThan(0);
    
    const products = await protoService.parseArray(arrayBuffer);
    
    // Validate results
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBe(productCount);
    
    // Validate product structure
    const firstProduct = products[0];
    expect(typeof firstProduct.id).toBe('number');
    expect(typeof firstProduct.name).toBe('string');
    expect(typeof firstProduct.category).toBe('string');
    expect(typeof firstProduct.price).toBe('number');
    
    console.log(`✅ Successfully parsed ${products.length} products`);
    console.log(`� Data size: ${arrayBuffer.byteLength.toLocaleString()} bytes`);
    console.log(`🔍 First product:`, JSON.stringify(firstProduct, null, 2));
  });

  test('should fetch and parse protobuf data single product', async () => {
    
    const url = `${API_BASE_URL}/products/id`;
    
    console.log(`🚀 Testing protobuf fetch from: ${url}`);
    
    // Fetch protobuf data
    const response = await fetch(url, {
      headers: {
        'Accept': API_CONFIG.FORMATS.PROTOBUF,
        'Content-Type': 'application/json'
      }
    });
    
    expect(response.ok).toBe(true);
    expect(response.headers.get('content-type')).toBe('application/x-protobuf');
    
    // Get ArrayBuffer and parse
    const arrayBuffer = await response.arrayBuffer();
    expect(arrayBuffer.byteLength).toBeGreaterThan(0);
    
    // Even single product comes as length-prefixed array, so use parseArray
    const firstProduct = await protoService.parse(arrayBuffer);
   
    
    
    expect(typeof firstProduct.id).toBe('number');
    expect(typeof firstProduct.name).toBe('string');
    expect(typeof firstProduct.category).toBe('string');
    expect(typeof firstProduct.price).toBe('number');
    
    console.log(`🔍 Single product:`, JSON.stringify(firstProduct, null, 2));
  });
});
