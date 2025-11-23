const { createAgent } = require("langchain");
const { HumanMessage } = require("@langchain/core/messages");
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
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

      const systemPrompt = fs.readFileSync(path.join(__dirname, 'prompts', 'mainAgent.yaml'), 'utf-8');
      const systemPromptYaml = yaml.load(systemPrompt);
      this.agent = await createAgent({
        model,
        tools,
        systemPrompt: systemPromptYaml.systemPrompt
      });

      console.log('[MainAgent] Agent initialized successfully');
      this.initialized = true;
    } catch (error) {
      console.error('[MainAgent] Initialization error:', error);
      throw error;
    }
  }

  async execute(input, config = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log('[MainAgent] Executing with input:', input);

      const humanMessage = new HumanMessage(input.query || input);

      const result = await this.agent.invoke({
        messages: [humanMessage],
      }, {streamMode: 'custom', ...config});

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
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log('[MainAgent] Invoking with input:', input);

      const humanMessage = new HumanMessage(input.userQuery || input);
      const result = await this.agent.invoke({
        messages: [humanMessage],
      }, input.config || {});

      console.log('[MainAgent] Invocation completed');

      return result;

    } catch (error) {
      console.error('[MainAgent] Invocation error:', error);
      throw error;
    }
  }

}

module.exports = MainAgent;
