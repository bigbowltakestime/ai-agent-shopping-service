const langchainService = require('../services/langchainService');
const {
  searchProductsTool,
  searchReviewsTool
} = require('./tools/productTools');
const { HumanMessage } = require("@langchain/core/messages");
const { createAgent } = require("langchain");
// Agent class wrapper
class ProductAgent {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize LangChain service first
      await langchainService.initialize();

      // Define the tools the agent will have access to.
      const tools = [
        searchProductsTool,
        searchReviewsTool
      ];

      const model = langchainService.getChatModel();

      this.agent = await createAgent({
        model,
        tools,
      });

      console.log('[ProductAgent] Agent initialized successfully');
      this.initialized = true;
    }catch (error) {
      console.error('[ProductAgent] Initialization error:', error);
      throw error;
    }
  }

  async execute(input, config = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log('[ProductAgent] Executing with input:', input);

      const humanMessage = new HumanMessage(JSON.stringify(input));
      const result = await this.agent.invoke({
        messages: [humanMessage]
      }, config);
      if (!result.messages) {
        return "No response from agent";
      }
      if (!result.messages[result.messages.length - 1]) {
        return "No response from agent";
      }
      return result.messages[result.messages.length - 1].content;

    } catch (error) {
      console.error('[ProductAgent] Execution error:', error);
      throw error;
    }
  }
}

module.exports = ProductAgent;
