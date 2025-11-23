const db = require('../db/connection');

class DBInterface {

  // Search products with filters
  async searchProducts(filters = {}, limit = 10, offset = 0) {
    try {
      let query = 'SELECT * FROM products WHERE 1=1';
      const params = [];

      if (filters.id) {
        if (typeof filters.id === 'number') {
          query += ' AND id = ?';
          params.push(filters.id);
        } else {
          query += ' AND name LIKE ?';
          params.push(`%${filters.id}%`);
        }
      }

      if (filters.name) {
        query += ' AND name LIKE ?';
        params.push(`%${filters.name}%`);
      }

      if (filters.min_rank !== undefined) {
        query += ' AND rank >= ?';
        params.push(filters.min_rank);
      }

      if (filters.max_rank !== undefined) {
        query += ' AND rank <= ?';
        params.push(filters.max_rank);
      }

      if (filters.category) {
        query += ' AND category LIKE ?';
        params.push(`%${filters.category}%`);
      }

      if (filters.brand) {
        query += ' AND brand LIKE ?';
        params.push(`%${filters.brand}%`);
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
        query += ' ORDER BY rating DESC, id ASC';
      }

      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const rows = await db.all(query, params);
      return rows.map(row => {
        // const ingredients = row.ingredients ? JSON.parse(row.ingredients) : [];
        // const reviews = row.reviews ? JSON.parse(row.reviews) : [];
        return {
          ...row,
          rating: parseFloat(row.rating),
          price: parseFloat(row.price),
          // review_count: reviews.length,
          // ingredients: ingredients,
        };
      });
    } catch (error) {
      console.error('Search products error:', error);
      throw error;
    }
  }

  // Get product by ID
  async getProductById(id) {
    try {
      const product = await db.get('SELECT * FROM products WHERE id = ?', [id]);
      if (!product) return null;

      const ingredients = product.ingredients ? JSON.parse(product.ingredients) : [];
      const reviews = product.reviews ? JSON.parse(product.reviews) : [];
      return {
        ...product,
        rating: parseFloat(product.rating),
        price: parseFloat(product.price),
        review_count: reviews.length,
        ingredients: ingredients
      };
    } catch (error) {
      console.error('Get product by ID error:', error);
      throw error;
    }
  }

  async searchReviews(productId) {
    const product = await this.getProductById(productId);
    return product.reviews;
  }
}

module.exports = new DBInterface();
