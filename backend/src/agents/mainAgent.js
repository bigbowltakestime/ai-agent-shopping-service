const { createAgent } = require("langchain");
const { HumanMessage } = require("@langchain/core/messages");
const langchainService = require('../services/langchainService');
const {
  callProductAgentTool,
  getMessageTemplateTool,
  sendMessageTool
} = require('./tools/mainAgentTools');

// Agent class wrapper with ReAct-style tool integration
class MainAgent {
  constructor() {
    this.initialized = false;
    this.agent = null;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize LangChain service first
      await langchainService.initialize();

      // Define the tools the agent will have access to.
      const tools = [
        callProductAgentTool,
        getMessageTemplateTool,
        sendMessageTool
      ];

      const model = langchainService.getChatModel();

      this.agent = await createAgent({
        model,
        tools,
        systemPrompt: `You are a skincare AI assistant. Your task is to help users find and buy skincare products. You can use tools to retrieve product information and provide accurate recommendations. Always be concise, clear, and accurate.

        Guidelines:
        1. You will handle only skincare products.
        2. Use tools whenever needed to get product details.
        3. Normally, at the end of your response, send your message to the UI using send_message_tool so it can display your response.
        4. Normally you will check message template using get_message_template_tool and then send your message to the UI using send_message_tool .
        4. If multiple messages are needed, you can call send_message_tool multiple times.
        5. Be smart in structuring your responses to provide helpful, actionable, and user-friendly guidance.
        6. Do your best to fulfill user's request.
        7. prefer to use message type product, suggested, loading, review as a response because it is more user-friendly.

        Example workflow:
        user : "에스트라 아토베리어365 크림 80ml 기획상품 찾아줘"
        you : call product agent tool
        product agent tool : return product information
        you : call get_message_template_tool type product
        get_message_template_tool : return product template
        you : call get_message_template_tool type chatMessage
        get_message_template_tool : return chatMessage template
        you : call send_message_tool with product template
        send_message_tool : send message to UI
        you : call send_message_tool with chatMessage template
        send_message_tool : send message to UI
        
        `,
      });

      console.log('[MainAgent] Agent initialized successfully');
      this.initialized = true;
    } catch (error) {
      console.error('[MainAgent] Initialization error:', error);
      throw error;
    }
  }

  async execute(input) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log('[MainAgent] Executing with input:', input);

      const humanMessage = new HumanMessage(input.query || input);
      const result = await this.agent.invoke({
        messages: [humanMessage],
      });

      console.log('[MainAgent] Execution completed');

      if (!result.messages) {
        return {
          response: "No response from agent",
          metadata: {}
        };
      }
      if (!result.messages[result.messages.length - 1]) {
        return {
          response: "No response from agent",
          metadata: {}
        };
      }

      return {
        response: result.messages[result.messages.length - 1].content,
        metadata: {}
      };
    } catch (error) {
      console.error('[MainAgent] Execution error:', error);
      throw error;
    }
  }

  // Invoke method for chat endpoint
  async invoke(input) {
    return this.execute(input);
  }

}

module.exports = MainAgent;
