// Agent Orchestration Layer
const langchainService = require('../services/langchainService');

class AgentManager {
  constructor() {
    this.agents = new Map();
    this.contexts = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await langchainService.initialize();

      // Initialize available agents
      this.agents.set('product', require('./productAgent'));
      this.agents.set('purchase', require('./purchaseAgent'));
      this.agents.set('memory', require('./memoryAgent'));
      this.agents.set('main', require('./mainAgent'));

      // Initialize each agent
      for (const [name, agent] of this.agents.entries()) {
        if (typeof agent.initialize === 'function') {
          await agent.initialize();
          console.log(`Agent ${name} initialized`);
        }
      }

      this.initialized = true;
      console.log('Agent manager initialized successfully');
    } catch (error) {
      console.error('Agent manager initialization error:', error);
      throw error;
    }
  }

  // Get agent instance by name
  getAgent(agentName) {
    if (!this.initialized) {
      throw new Error('Agent manager not initialized');
    }

    const agent = this.agents.get(agentName);
    if (!agent) {
      throw new Error(`Agent '${agentName}' not found`);
    }

    return agent;
  }

  // Create session context
  createContext(sessionId = null) {
    const contextId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const context = {
      id: contextId,
      createdAt: new Date().toISOString(),
      messages: [],
      metadata: {},
      agentStates: {},
      memory: '',
      stepCount: 0,
      maxSteps: 10 // Prevent infinite loops
    };

    this.contexts.set(contextId, context);
    return contextId;
  }

  // Get context by ID
  getContext(contextId) {
    return this.contexts.get(contextId);
  }

  // Update context
  updateContext(contextId, updates) {
    const context = this.getContext(contextId);
    if (!context) return null;

    Object.assign(context, updates);
    return context;
  }

  // Add message to context
  addMessageToContext(contextId, message) {
    const context = this.getContext(contextId);
    if (!context) return false;

    context.messages.push({
      ...message,
      timestamp: new Date().toISOString(),
      id: `msg_${context.messages.length}`
    });

    return true;
  }

  // Get context history formatted for LLM
  getContextHistory(contextId, limit = 20) {
    const context = this.getContext(contextId);
    if (!context) return [];

    return context.messages
      .slice(-limit)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));
  }

  // Execute agent with context
  async executeAgent(agentName, input, contextId = null, options = {}) {
    try {
      const agent = this.getAgent(agentName);

      // Create context if not provided
      if (!contextId) {
        contextId = this.createContext();
      }

      const context = this.getContext(contextId);
      if (!context) {
        throw new Error(`Context not found: ${contextId}`);
      }

      // Check step limit to prevent loops
      if (context.stepCount >= context.maxSteps) {
        throw new Error(`Maximum steps (${context.maxSteps}) exceeded for context ${contextId}`);
      }

      // Add input to context
      if (input && typeof input === 'string') {
        this.addMessageToContext(contextId, {
          role: 'user',
          content: input
        });
      }

      // Execute agent
      const result = await agent.execute(input, contextId, options);

      // Add agent response to context
      if (result.response) {
        this.addMessageToContext(contextId, {
          role: 'assistant',
          content: result.response,
          agent: agentName,
          metadata: result.metadata
        });
      }

      // Update context
      context.stepCount++;
      context.lastExecution = new Date().toISOString();
      context.agentStates[agentName] = {
        lastExecuted: new Date().toISOString(),
        result: result
      };

      return {
        contextId,
        result,
        context: {
          id: contextId,
          stepCount: context.stepCount,
          messages: context.messages.length
        }
      };

    } catch (error) {
      console.error(`Agent execution error (${agentName}):`, error);

      // Add error to context
      if (contextId) {
        this.addMessageToContext(contextId, {
          role: 'system',
          content: `Error executing agent ${agentName}: ${error.message}`,
          metadata: { error: error.message }
        });
      }

      throw error;
    }
  }

  // Execute agent chain (for multi-agent workflows)
  async executeChain(chain, input, contextId = null) {
    try {
      let currentInput = input;
      let results = [];
      let currentContextId = contextId;

      for (const step of chain) {
        const { agent, options = {} } = step;

        console.log(`Executing agent: ${agent}`);
        const execution = await this.executeAgent(agent, currentInput, currentContextId, options);
        results.push(execution);
        currentContextId = execution.contextId;

        // Pass result as input to next agent if needed
        if (step.passResult && execution.result.response) {
          currentInput = execution.result.response;
        }
      }

      return {
        contextId: currentContextId,
        chain: results,
        finalResult: results[results.length - 1]?.result
      };

    } catch (error) {
      console.error('Agent chain execution error:', error);
      throw error;
    }
  }

  // Cleanup old contexts (for memory management)
  cleanupOldContexts(hoursOld = 24) {
    const cutoffTime = Date.now() - (hoursOld * 60 * 60 * 1000);
    let cleanupCount = 0;

    for (const [id, context] of this.contexts.entries()) {
      const contextTime = new Date(context.createdAt).getTime();
      if (contextTime < cutoffTime || context.messages.length === 0) {
        this.contexts.delete(id);
        cleanupCount++;
      }
    }

    console.log(`Cleaned up ${cleanupCount} old contexts`);
    return cleanupCount;
  }

  // Get agent status
  getStatus() {
    const status = {
      initialized: this.initialized,
      agentCount: this.agents.size,
      contextCount: this.contexts.size,
      agents: []
    };

    for (const [name] of this.agents.entries()) {
      status.agents.push({
        name,
        available: true
      });
    }

    return status;
  }

  // Shutdown all agents
  async shutdown() {
    console.log('Shutting down agent manager...');

    // Cleanup contexts
    this.contexts.clear();

    // Shutdown agents that support it
    for (const [name, agent] of this.agents.entries()) {
      if (typeof agent.shutdown === 'function') {
        try {
          await agent.shutdown();
          console.log(`Agent ${name} shut down`);
        } catch (error) {
          console.error(`Error shutting down agent ${name}:`, error);
        }
      }
    }

    this.initialized = false;
    console.log('Agent manager shut down');
  }
}

// Export singleton instance
module.exports = new AgentManager();
