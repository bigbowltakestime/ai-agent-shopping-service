const { tool } = require('@langchain/core/tools');
const { z } = require('zod');
const dbInterface = require('../../services/dbInterface');
const langchainService = require('../../services/langchainService');

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
  async ({ id, name, min_price, max_price, min_rank, max_rank, brand, ingredients, order_by, order_direction, limit = 10 }) => {
    try {
      console.log(`[ProductAgent] Executing search_products with filters:`, { id, name, min_price, max_price, min_rank, max_rank, brand, ingredients, order_by, order_direction, limit });

      // Use existing database interface for product search
      const results = await dbInterface.searchProducts({
        id,
        name,
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

      // Exclude unwanted fields
      const filteredResults = excludeFieldsFromResults(results, ['reviews', 'additional_info', 'ingredients']);

      return JSON.stringify(filteredResults);
    } catch (error) {
      console.error('[ProductAgent] search_products error:', error);
      throw new Error(`Failed to search products: ${error.message}`);
    }
  },
  {
    name: 'search_products',
    description: 'Search for products based on various filters like price range, rating, brand, and ingredients. Returns structured product data.',
    schema: z.object({
      id: z.string().optional().describe('Product id to filter by'),
      name: z.string().optional().describe('Product name to filter by'),
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
  async ({ productId}) => {
    try {
      console.log(`[ProductAgent] Executing search_reviews for product ${productId}`);

      const results = await dbInterface.searchReviews(productId);

      console.log(`[ProductAgent] Found ${results.length} relevant reviews`);
      return JSON.stringify(results);
    } catch (error) {
      console.error('[ProductAgent] search_reviews error:', error);
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
