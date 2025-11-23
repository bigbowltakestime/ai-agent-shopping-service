const { ChatOpenAI } = require('@langchain/openai');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { StateGraph, START, END } = require('@langchain/langgraph');
const config = require('../config/config');

let chatModel;
let embeddingsModel;

class LangChainService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize Chat Model (GPT-4)
      chatModel = new ChatOpenAI({
        openAIApiKey: config.OPENAI_API_KEY,
        modelName: 'gpt-4o-mini',
        temperature: 1, // Low temperature for more deterministic responses
        maxTokens: 2000, // Limit response length
        maxRetries: 3,
        timeout: 60000, // 60 seconds
      });

      // Initialize Embedding Model
      embeddingsModel = new OpenAIEmbeddings({
        openAIApiKey: config.OPENAI_API_KEY,
        modelName: 'text-embedding-3-small',
      });

      this.initialized = true;
      console.log('LangChain service initialized successfully');
    } catch (error) {
      console.error('LangChain service initialization error:', error);
      throw error;
    }
  }

  // Get Chat Model Instance
  getChatModel() {
    if (!this.initialized) {
      throw new Error('LangChain service not initialized');
    }
    return chatModel;
  }

  // Get Embeddings Model Instance
  getEmbeddingsModel() {
    if (!this.initialized) {
      throw new Error('LangChain service not initialized');
    }
    return embeddingsModel;
  }

  // Generate Embeddings for Text
  async generateEmbeddings(texts) {
    if (!this.initialized) await this.initialize();
    return await embeddingsModel.embedDocuments(texts);
  }

  // Generate Embedding for Single Text
  async generateEmbedding(text) {
    if (!this.initialized) await this.initialize();
    return await embeddingsModel.embedQuery(text);
  }

  // Create Chat Completion
  async createChatCompletion(messages, options = {}) {
    if (!this.initialized) await this.initialize();

    const defaultOptions = {
      temperature: 0.1,
      maxTokens: 1500,
      ...options
    };

    try {
      const response = await chatModel.invoke(messages, defaultOptions);
      return response.content;
    } catch (error) {
      console.error('Chat completion error:', error);
      throw error;
    }
  }

  // Cleanup and close connections
  async close() {
    if (chatModel) {
      // ChatOpenAI doesn't have explicit close method
      console.log('LangChain service closed');
    }
  }
}

module.exports = new LangChainService();
