/**
 * Calculate median value from an array of numbers
 * @param {number[]} values - Array of numeric values
 * @returns {number} - Median value
 */
export const calculateMedian = (values) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/**
 * Generate timing breakdown chart data from results
 * @param {Array} results - Benchmark results array
 * @param {Array} formatOptions - Format configuration array
 * @returns {Array} - Timing breakdown data for chart
 */
export const generateTimingBreakdownData = (results, formatOptions) => {
  if (!results || results.length === 0 || !formatOptions) return [];
  
  return formatOptions.map(format => {
    // Filter results that match this format value
    const formatResults = results.filter(r => r.format === format.value);
    if (formatResults.length === 0) return null;
    
    const networkTimes = formatResults.map(r => r.timing?.networkTime || 0).filter(t => t > 0);
    const serverSerializeTimes = formatResults.map(r => r.timing?.serverSerialize || 0).filter(t => t > 0);
    const clientDeserializeTimes = formatResults.map(r => r.timing?.clientDeserialize || 0).filter(t => t > 0);
    
    const medianNetwork = networkTimes.length > 0 ? calculateMedian(networkTimes) : 0;
    const medianServerSerialize = serverSerializeTimes.length > 0 ? calculateMedian(serverSerializeTimes) : 0;
    const medianClientDeserialize = clientDeserializeTimes.length > 0 ? calculateMedian(clientDeserializeTimes) : 0;
    
    return {
      format: format.name,
      networkTime: medianNetwork,
      serverSerializeTime: medianServerSerialize,
      clientDeserializeTime: medianClientDeserialize
    };
  }).filter(Boolean);
};

/**
 * Generate chart data grouped by product count with median calculations
 * @param {Array} results - Benchmark results array
 * @returns {Object} - Chart data grouped by product count
 */
export const generatePerformanceChartData = (results) => {
  if (!results || results.length === 0) return {};
  
  // Group results by product count and format
  const chartData = results.reduce((acc, result) => {
    const key = `${result.productCount}_${result.format}`;
    if (!acc[key]) {
      acc[key] = {
        productCount: result.productCount,
        format: result.format,
        endToEndTimes: [],
        networkTimes: [],
        clientDeserializeTimes: [],
        serverSerializeTimes: [],
        serverTotalTimes: [],
        dataSizes: [],
        throughputs: []
      };
    }
    
    acc[key].endToEndTimes.push(result.endToEndTime);
    acc[key].networkTimes.push(result.networkTime || 0);
    acc[key].clientDeserializeTimes.push(result.clientDeserializeTime || 0);
    acc[key].serverSerializeTimes.push(result.serverSerializeTime || 0);
    acc[key].serverTotalTimes.push(result.serverTotalTime || 0);
    acc[key].dataSizes.push(result.dataSize);
    acc[key].throughputs.push(result.throughput);
    
    return acc;
  }, {});

  // Calculate median values for all metrics
  const medianData = Object.values(chartData).map(item => ({
    productCount: item.productCount,
    format: item.format,
    medianEndToEnd: Math.round(calculateMedian(item.endToEndTimes)),
    medianNetwork: Math.round(calculateMedian(item.networkTimes)),
    medianClientDeserialize: Math.round(calculateMedian(item.clientDeserializeTimes)),
    medianServerSerialize: Math.round(calculateMedian(item.serverSerializeTimes)),
    medianServerTotal: Math.round(calculateMedian(item.serverTotalTimes)),
    medianDataSize: Math.round(calculateMedian(item.dataSizes)),
    medianThroughput: parseFloat(calculateMedian(item.throughputs).toFixed(2))
  }));

  // Group by product count for charts
  return medianData.reduce((acc, item) => {
    if (!acc[item.productCount]) {
      acc[item.productCount] = { productCount: item.productCount };
    }
    const formatKey = item.format;
    acc[item.productCount][`${formatKey}_EndToEnd`] = item.medianEndToEnd;
    acc[item.productCount][`${formatKey}_Network`] = item.medianNetwork;
    acc[item.productCount][`${formatKey}_ClientDeserialize`] = item.medianClientDeserialize;
    acc[item.productCount][`${formatKey}_ServerSerialize`] = item.medianServerSerialize;
    acc[item.productCount][`${formatKey}_ServerTotal`] = item.medianServerTotal;
    acc[item.productCount][`${formatKey}_DataSize`] = item.medianDataSize;
    acc[item.productCount][`${formatKey}_Throughput`] = item.medianThroughput;
    return acc;
  }, {});
};
