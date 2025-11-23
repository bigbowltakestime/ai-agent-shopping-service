const { tool } = require('@langchain/core/tools');
const { z } = require('zod');
const dbInterface = require('../../services/dbInterface');
const langchainService = require('../../services/langchainService');
const { v4: uuidv4 } = require('uuid');

function makeLoadingMessage(msg) {
  return {
    id: uuidv4().toString(),
    type: 'loading',
    content: msg
  };
}

// Utility function to exclude specific fields from results
function excludeFieldsFromResults(results, fieldsToExclude = ['reviews', 'additional_info']) {
  const exclude = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    const result = {};
    for (const key in obj) {
      if (!fieldsToExclude.includes(key)) {
        result[key] = obj[key];
      }
    }
    return result;
  };

  if (Array.isArray(results)) {
    return results.map(exclude);
  } else {
    return exclude(results);
  }
}

// Tool: search_products
const searchProductsTool = tool(
  async ({ id, name, rank, min_price, max_price, min_rank, max_rank, brand, ingredients, order_by, order_direction, limit = 10 }, config) => {
    const { writer } = config || {};

    try {
      if (writer) {
        writer(makeLoadingMessage('상품 에이전트: 상품정보 검색중'));
      }

      console.log(`[ProductAgent] Executing search_products with filters:`, { id, name, rank, min_price, max_price, min_rank, max_rank, brand, ingredients, order_by, order_direction, limit });

      // Use existing database interface for product search
      const results = await dbInterface.searchProducts({
        id,
        name,
        rank,
        min_price,
        max_price,
        min_rank,
        max_rank,
        brand,
        ingredients,
        order_by,
        order_direction,
        limit
      });

      console.log(`[ProductAgent] Found ${results.length} products`);

      if (writer) {
        writer(makeLoadingMessage('상품 에이전트: 상품정보 검색 중'));
      }

      // Exclude unwanted fields
      const filteredResults = excludeFieldsFromResults(results, ['reviews', 'additional_info', 'ingredients']);

      return JSON.stringify(filteredResults);
    } catch (error) {
      console.error('[ProductAgent] search_products error:', error);

      if (writer) {
        writer(makeLoadingMessage('상품 에이전트: 상품정보 검색 실패'));
      }

      throw new Error(`Failed to search products: ${error.message}`);
    }
  },
  {
    name: 'search_products',
    description: 'Search for products based on various filters like price range, rating, brand, and ingredients. Returns structured product data.',
    schema: z.object({
      id: z.string().optional().describe('Product id to filter by'),
      name: z.string().optional().describe('Product name to filter by'),
      rank: z.number().optional().describe('Product rank to filter by; the lower the number, the higher the rank (1st, 2nd, 3rd).'),
      min_price: z.number().optional().describe('Minimum price filter'),
      max_price: z.number().optional().describe('Maximum price filter'),
      min_rank: z.number().optional().describe('Minimum rank filter'),
      max_rank: z.number().optional().describe('Maximum rank filter'),
      brand: z.string().optional().describe('Brand name to filter by'),
      ingredients: z.string().optional().describe('Ingredients to match (LIKE pattern, e.g. chemical name like "글리세린")'),
      order_by: z.string().optional().describe('Field to order by'),
      order_direction: z.string().optional().describe('Direction to order by (asc or desc)'),
      limit: z.number().optional().default(10).describe('Maximum number of results to return')
    })
  }
);

// Tool: search_reviews
const searchReviewsTool = tool(
  async ({ productId}, config) => {
    const { writer } = config || {};

    try {
      console.log(`[ProductAgent] Executing search_reviews for product ${productId}`);

      if (writer) {
        writer(makeLoadingMessage('상품 에이전트: 리뷰 검색중'));
      }

      const results = await dbInterface.searchReviews(productId);

      console.log(`[ProductAgent] Found ${results.length} relevant reviews`);

      if (writer) {
        writer(makeLoadingMessage('상품 에이전트: 리뷰 검색 완료'));
      }

      return JSON.stringify(results);
    } catch (error) {
      console.error('[ProductAgent] search_reviews error:', error);

      if (writer) {
        writer(makeLoadingMessage('상품 에이전트: 리뷰 검색 실패'));
      }

      throw new Error(`Failed to search reviews: ${error.message}`);
    }
  },
  {
    name: 'search_reviews',
    description: 'Search for reviews of a specific product using sqlite database.',
    schema: z.object({
      productId: z.string().describe('The product ID to search reviews for'),
    })
  }
);


module.exports = {
  searchProductsTool,
  searchReviewsTool
};
