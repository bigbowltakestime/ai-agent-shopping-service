const { connect } = require('lancedb');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { LanceDB } = require('@langchain/community/vectorstores/lancedb');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

let db;
let embeddingsModel;

class LanceDBService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Ensure directory exists
      const dbPath = path.resolve(process.cwd(), config.LANCEDB_URI);
      const dbDir = path.dirname(dbPath);

      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Initialize LanceDB connection
      db = await connect(dbPath);
      console.log('LanceDB connection established');

      // Create embeddings model
      embeddingsModel = new OpenAIEmbeddings({
        openAIApiKey: config.OPENAI_API_KEY,
        modelName: 'text-embedding-3-small',
      });

      this.initialized = true;
    } catch (error) {
      console.error('LanceDB initialization error:', error);
      throw error;
    }
  }

  async createReviewsTable() {
    if (!this.initialized) await this.initialize();

    const schema = {
      id: 'string',
      product_id: 'string',
      text: 'string',
      sentiment: 'float', // -1 to 1
      features: 'string', // JSON string of features
      embedding: 'fixed_size_list[1536]float32' // 1536 dims for text-embedding-3-small
    };

    try {
      await db.createTable('reviews', schema);
      console.log('Reviews table created');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('Reviews table already exists');
      } else {
        throw error;
      }
    }
  }

  async getReviewsTable() {
    if (!this.initialized) await this.initialize();

    try {
      const table = await db.openTable('reviews');
      return table;
    } catch (error) {
      if (error.message.includes('not found')) {
        await this.createReviewsTable();
        return await db.openTable('reviews');
      }
      throw error;
    }
  }

  async insertReview(reviewData) {
    if (!this.initialized) await this.initialize();

    try {
      const table = await this.getReviewsTable();

      // Generate embedding if not provided
      let embedding = reviewData.embedding;
      if (!embedding) {
        const embeddingResult = await embeddingsModel.embedQuery(reviewData.text);
        embedding = embeddingResult;
      }

      const review = {
        id: reviewData.id || `${reviewData.product_id}_${Date.now()}`,
        product_id: reviewData.product_id,
        text: reviewData.text,
        sentiment: reviewData.sentiment || 0.0,
        features: JSON.stringify(reviewData.features || []),
        embedding: embedding
      };

      await table.add([review]);
      console.log(`Review inserted with ID: ${review.id}`);
      return review.id;
    } catch (error) {
      console.error('Insert review error:', error);
      throw error;
    }
  }

  async searchReviews(productId, limit = 10) {
    if (!this.initialized) await this.initialize();

    try {
      const table = await this.getReviewsTable();

      let query = table.search('');
      if (productId) {
        query = query.where(`product_id = '${productId}'`);
      }

      const results = await query.limit(limit).toArray();
      return results.map(row => ({
        id: row.id,
        product_id: row.product_id,
        text: row.text,
        sentiment: row.sentiment,
        features: JSON.parse(row.features || '[]'),
        embedding: row.embedding
      }));
    } catch (error) {
      console.error('Search reviews error:', error);
      throw error;
    }
  }

  async vectorSearchReviews(query, limit = 10, minSimilarity = 0.1) {
    if (!this.initialized) await this.initialize();

    try {
      const table = await this.getReviewsTable();

      // Create a vector store for similarity search
      const vectorStore = new LanceDB(embeddingsModel, {
        table: table
      });

      const searchResults = await vectorStore.similaritySearchWithScore(query, limit);

      return searchResults
        .filter(([doc, score]) => score >= minSimilarity)
        .map(([doc, score]) => ({
          id: doc.metadata.id,
          product_id: doc.metadata.product_id,
          text: doc.pageContent,
          sentiment: doc.metadata.sentiment || 0.0,
          features: JSON.parse(doc.metadata.features || '[]'),
          score: score,
          embedding: doc.metadata.embedding
        }));
    } catch (error) {
      console.error('Vector search reviews error:', error);
      throw error;
    }
  }

  async deleteReview(reviewId) {
    if (!this.initialized) await this.initialize();

    try {
      const table = await this.getReviewsTable();
      await table.delete(`id = '${reviewId}'`);
      console.log(`Review deleted: ${reviewId}`);
      return true;
    } catch (error) {
      console.error('Delete review error:', error);
      throw error;
    }
  }

  async getReviewStats(productId = null) {
    if (!this.initialized) await this.initialize();

    try {
      const reviews = await this.searchReviews(productId, 1000); // Get all matching reviews

      const stats = {
        total: reviews.length,
        average_sentiment: 0,
        sentiment_distribution: { positive: 0, neutral: 0, negative: 0 },
        features_count: {}
      };

      if (reviews.length > 0) {
        const sentiments = reviews.map(r => r.sentiment);
        stats.average_sentiment = sentiments.reduce((a, b) => a + b) / sentiments.length;

        sentiments.forEach(sentiment => {
          if (sentiment > 0.1) stats.sentiment_distribution.positive++;
          else if (sentiment < -0.1) stats.sentiment_distribution.negative++;
          else stats.sentiment_distribution.neutral++;
        });

        // Count features
        reviews.forEach(review => {
          if (review.features) {
            review.features.forEach(feature => {
              stats.features_count[feature] = (stats.features_count[feature] || 0) + 1;
            });
          }
        });
      }

      return stats;
    } catch (error) {
      console.error('Get review stats error:', error);
      throw error;
    }
  }
}

module.exports = new LanceDBService();
