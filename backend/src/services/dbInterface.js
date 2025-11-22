const db = require('../db/connection');
const lancedbService = require('./lancedbService');

// Database Interface Utilities

class DBInterface {
  // === PRODUCTS OPERATIONS ===

  // Search products with filters
  async searchProducts(filters = {}, limit = 20, offset = 0) {
    try {
      let query = 'SELECT * FROM products WHERE 1=1';
      const params = [];

      if (filters.id) {
        query += ' AND id LIKE ?';
        params.push(`%${filters.id}%`);
      }

      if (filters.name) {
        query += ' AND name LIKE ?';
        params.push(`%${filters.name}%`);
      }

      if (filters.category) {
        query += ' AND category LIKE ?';
        params.push(`%${filters.category}%`);
      }

      if (filters.brand) {
        query += ' AND brand LIKE ?';
        params.push(`%${filters.brand}%`);
      }

      if (filters.min_rating !== undefined) {
        query += ' AND rating >= ?';
        params.push(filters.min_rating);
      }

      if (filters.max_rating !== undefined) {
        query += ' AND rating <= ?';
        params.push(filters.max_rating);
      }

      if (filters.min_price !== undefined) {
        query += ' AND price >= ?';
        params.push(filters.min_price);
      }

      if (filters.max_price !== undefined) {
        query += ' AND price <= ?';
        params.push(filters.max_price);
      }

      if (filters.ingredients) {
        query += ' AND ingredients LIKE ?';
        params.push(`%${filters.ingredients}%`);
      }

      // Ordering
      if (filters.order_by) {
        query += ` ORDER BY ${filters.order_by}`;
        if (filters.order_direction && filters.order_direction.toLowerCase() === 'desc') {
          query += ' DESC';
        } else {
          query += ' ASC';
        }
      } else {
        query += ' ORDER BY rating DESC, review_count DESC';
      }

      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const rows = db.all(query, params);
      return rows.map(row => ({
        ...row,
        rating: parseFloat(row.rating),
        price: parseFloat(row.price),
        review_count: parseInt(row.review_count),
        ingredients: row.ingredients ? row.ingredients.split(',').map(i => i.trim()) : []
      }));
    } catch (error) {
      console.error('Search products error:', error);
      throw error;
    }
  }

  // Get product by ID
  async getProductById(id) {
    try {
      const product = db.get('SELECT * FROM products WHERE id = ?', [id]);
      if (!product) return null;

      return {
        ...product,
        rating: parseFloat(product.rating),
        price: parseFloat(product.price),
        review_count: parseInt(product.review_count),
        ingredients: product.ingredients ? product.ingredients.split(',').map(i => i.trim()) : []
      };
    } catch (error) {
      console.error('Get product by ID error:', error);
      throw error;
    }
  }

  // Insert/Update product
  async upsertProduct(productData) {
    try {
      const ingredients = Array.isArray(productData.ingredients)
        ? productData.ingredients.join(', ')
        : productData.ingredients || '';

      const now = new Date().toISOString();

      const existingProduct = await this.getProductById(productData.id);

      if (existingProduct) {
        // Update
        db.run(`
          UPDATE products SET
            name = ?, category = ?, price = ?, rating = ?, review_count = ?,
            brand = ?, ingredients = ?, updated_at = ?
          WHERE id = ?
        `, [
          productData.name, productData.category, productData.price,
          productData.rating, productData.review_count, productData.brand,
          ingredients, now, productData.id
        ]);
      } else {
        // Insert
        db.run(`
          INSERT INTO products (id, name, category, price, rating, review_count, brand, ingredients, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          productData.id, productData.name, productData.category, productData.price,
          productData.rating, productData.review_count, productData.brand,
          ingredients, now
        ]);
      }

      return productData.id;
    } catch (error) {
      console.error('Upsert product error:', error);
      throw error;
    }
  }

  // === CHAT HISTORY OPERATIONS ===

  // Save chat message
  async saveChatMessage(message, role) {
    try {
      db.run('INSERT INTO chat_history (message, role) VALUES (?, ?)', [message, role]);
      // Return last insert ID
      const row = db.get('SELECT last_insert_rowid() as id');
      return row.id;
    } catch (error) {
      console.error('Save chat message error:', error);
      throw error;
    }
  }

  // Get recent chat messages
  async getRecentChatMessages(limit = 50) {
    try {
      const rows = db.all(`
        SELECT * FROM chat_history
        ORDER BY timestamp DESC
        LIMIT ?
      `, [limit]);

      return rows.reverse(); // Return chronological order
    } catch (error) {
      console.error('Get recent chat messages error:', error);
      throw error;
    }
  }

  // Get chat conversation (for context)
  async getConversationforAgent(sessionId = null, limit = 20) {
    try {
      let rows = await this.getRecentChatMessages(limit);
      return rows.map(row => ({
        id: row.id,
        role: row.role,
        content: row.message,
        timestamp: row.timestamp
      }));
    } catch (error) {
      console.error('Get conversation for agent error:', error);
      throw error;
    }
  }

  // Clear old chat history (cleanup)
  async cleanupOldChatHistory(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = db.run(`
        DELETE FROM chat_history
        WHERE timestamp < ?
      `, [cutoffDate.toISOString()]);

      return result.changes || 0;
    } catch (error) {
      console.error('Cleanup old chat history error:', error);
      throw error;
    }
  }

  // === REVIEW OPERATIONS (via LanceDB) ===

  async searchReviews(productId, limit = 10) {
    return await lancedbService.searchReviews(productId, limit);
  }

  async vectorSearchReviews(query, limit = 10) {
    return await lancedbService.vectorSearchReviews(query, limit);
  }

  async insertReview(reviewData) {
    return await lancedbService.insertReview(reviewData);
  }

  async getReviewStats(productId) {
    return await lancedbService.getReviewStats(productId);
  }

  // === DATA SEEDING ===

  async seedSampleData() {
    try {
      console.log('Starting data seeding...');

      await lancedbService.initialize();
      await lancedbService.createReviewsTable();

      // Sample products
      const sampleProducts = [
        {
          id: 'PROD001',
          name: 'CeraVe Moisturizing Cream',
          category: 'skincare',
          price: 16.99,
          rating: 4.5,
          review_count: 2341,
          brand: 'CeraVe',
          ingredients: ['ceramide', 'hyaluronic acid', 'niacinamide']
        },
        {
          id: 'PROD002',
          name: 'The Ordinary Hyaluronic Acid',
          category: 'skincare',
          price: 7.20,
          rating: 4.3,
          review_count: 1256,
          brand: 'The Ordinary',
          ingredients: ['hyaluronic acid', 'vitamin B5']
        },
        {
          id: 'PROD003',
          name: 'La Roche-Posay Mat SPF 30',
          category: 'skincare',
          price: 19.99,
          rating: 4.2,
          review_count: 892,
          brand: 'La Roche-Posay',
          ingredients: ['niacinamide', 'SPF 30', 'matte finish']
        }
      ];

      for (const product of sampleProducts) {
        await this.upsertProduct(product);
      }

      // Sample reviews
      const sampleReviews = [
        {
          id: 'REV001',
          product_id: 'PROD001',
          text: 'This moisturizer works amazingly well for dry skin. Highly recommend!',
          sentiment: 0.8,
          features: ['hydration', 'dry skin relief']
        },
        {
          id: 'REV002',
          product_id: 'PROD001',
          text: 'Not impressed, my skin felt oily after using this.',
          sentiment: -0.3,
          features: ['oiliness']
        },
        {
          id: 'REV003',
          product_id: 'PROD002',
          text: 'Great value and effective hyaluronic acid serum.',
          sentiment: 0.7,
          features: ['value', 'effectiveness', 'hydration']
        }
      ];

      for (const review of sampleReviews) {
        await this.insertReview(review);
      }

      console.log('Data seeding completed successfully');
      return { products: sampleProducts.length, reviews: sampleReviews.length };
    } catch (error) {
      console.error('Data seeding error:', error);
      throw error;
    }
  }

  // === UTILITY FUNCTIONS ===

  async getDatabaseStats() {
    try {
      const productCount = db.get('SELECT COUNT(*) as count FROM products').count;
      const chatCount = db.get('SELECT COUNT(*) as count FROM chat_history').count;

      let reviewStats = { total: 0 };
      try {
        reviewStats = await lancedbService.getReviewStats();
      } catch (error) {
        console.log('LanceDB not yet initialized for stats');
      }

      return {
        products: productCount,
        chat_messages: chatCount,
        reviews: reviewStats.total,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Get database stats error:', error);
      throw error;
    }
  }
}

module.exports = new DBInterface();
