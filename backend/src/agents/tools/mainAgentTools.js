// Main Agent Tools
const { tool } = require('@langchain/core/tools');
const ProductAgent = require('../productAgent');
const { LangGraphRunnableConfig } = require("@langchain/langgraph");
const { v4: uuidv4 } = require('uuid');
// ----------------------------
// Example Data
// ----------------------------
const PRODUCTS_EXAMPLE = [
  { id: 1, name: 'Premium Shampoo for Oily Hair', price: 2999, rating: 4.5, image: 'https://mocheong-ai.s3.ap-southeast-2.amazonaws.com/A000000130138.jpg', detailLink: '#', rank: 1 },
  { id: 2, name: 'Gentle Conditioner', price: 1999, rating: 4.2, image: 'https://mocheong-ai.s3.ap-southeast-2.amazonaws.com/A000000130138.jpg', detailLink: '#', rank: 2 },
  { id: 3, name: 'Natural Hair Mask', price: 3999, rating: 4.8, image: 'https://mocheong-ai.s3.ap-southeast-2.amazonaws.com/A000000130138.jpg', detailLink: '#', rank: 3 },
];
// ----------------------------
// Example Messages
// ----------------------------
const MESSAGE_EXAMPLES = {
  multipleProduct: {
    id: 3,
    type: 'product',
    products: PRODUCTS_EXAMPLE,
    displayType: 'Box2',
    timestamp: new Date()
  },
  singleProduct: {
    id: 2,
    type: 'product',
    products: PRODUCTS_EXAMPLE.slice(0, 1),
    displayType: 'Box1',
    timestamp: new Date()
  },
  review: {
    id: 4,
    type: 'product',
    products: [
      {
        id: 1,
        name: 'Premium Shampoo for Oily Hair',
        price: 2999,
        image: '',
        reviews: [
          { text: 'This shampoo really controls oil without drying my scalp!', sentiment: 'Positive', features: ['oil control', 'not drying'] },
          { text: 'Great scent and lathers well. Highly recommend.', sentiment: 'Positive', features: ['scent', 'lathering'] }
        ]
      }
    ],
    displayType: 'review',
    timestamp: new Date()
  },
  suggested: {
    id: 7,
    type: 'suggested',
    suggestions: [
      { displayMessage: '스킨케어 추천', message: '스킨케어 제품 추천해줘' },
      { displayMessage: '인기 제품 추천', message: '인기 제품 정보 알려줘' },
      { displayMessage: '6번 제품 리뷰', message: '6번 제품 리뷰 알려줘' }
    ],
    timestamp: new Date()
  },
  loading: {
    id: 6,
    type: 'loading',
    content: 'AI 어시스턴트가 시작되고 있어요...'
  },
  chatMessage: {
    id: 1,
    type: 'chatMessage',
    role: 'agent',
    content: '안녕하세요 무엇을 도와드릴까요??',
    timestamp: new Date()
  }
};

// ----------------------------
// Load Message Templates
// ----------------------------
function loadMessageTypeTemplates() {
  return {
    chatMessage: MESSAGE_EXAMPLES.chatMessage,
    product: {
      multiple: MESSAGE_EXAMPLES.multipleProduct,
      single: MESSAGE_EXAMPLES.singleProduct
    },
    review: MESSAGE_EXAMPLES.review,
    suggested: MESSAGE_EXAMPLES.suggested,
    loading: MESSAGE_EXAMPLES.loading
  };
}

function makeLoadingMessage(msg) {
  return {
    id: uuidv4().toString(),
    type: 'loading',
    content: msg
  };
}

// ----------------------------
// Tools
// ----------------------------
const callProductAgentTool = tool(
  async ({ command }, config) => {
    console.log(`[MainAgent] Calling product agent with command: "${command}"`);

    const writer = config?.writer;

    console.log(`[MainAgent] writer: ${writer}`);
    
    if (writer) {
      console.log(`[MainAgent] writer: try to send loading message`);
      const loadingMessage = makeLoadingMessage(`상품 에이전트 생각중...: ${command}`);
      console.log(`[MainAgent] Loading message: ${JSON.stringify(loadingMessage)}`);
      writer(loadingMessage);
      console.log(`[MainAgent] Loading message sent`);
    }

    
    try {
      const productAgent = new ProductAgent();
      const result = await productAgent.execute({ command }, config);
      console.log(`[MainAgent] Product agent responded successfully`);
      
      if (writer) {
        const successMessage = makeLoadingMessage(`상품 에이전트 작업 완료`);
        console.log(`[MainAgent] Success message: ${JSON.stringify(successMessage)}`);
        writer(successMessage);
        console.log(`[MainAgent] Success message sent`);
      }
      return { agent: 'product', response: result, success: true };
    } catch (error) {
      console.error('[MainAgent] Product agent call failed:', error);
      return {
        agent: 'product',
        response: "I'm sorry, I couldn't search for products right now. Please try again.",
        error: error.message,
        success: false
      };
    }
  },
  {
    name: 'call_product_agent',
    description: 'Call the product search agent to find skin care products based on user queries.',
    schema: {
      type: 'object',
      properties: { command: { type: 'string', description: 'The command to call the product agent' } },
      required: ['command']
    }
  }
);

const getMessageTemplateTool = tool(
  async ({ messageType }, config) => {
    console.log(`[MainAgent] Getting message template for type: ${messageType}`);
    const writer = config?.writer;
    if (writer) {
      console.log(`[MainAgent] writer: try to send loading message`);
      const loadingMessage = makeLoadingMessage(`응답 템플릿 검색 중... ${messageType}`);
      console.log(`[MainAgent] Loading message: ${JSON.stringify(loadingMessage)}`);
      writer(loadingMessage);
      console.log(`[MainAgent] Loading message sent`);
    }
    try {
      const templates = loadMessageTypeTemplates();
      const template = templates[messageType];
      if (!template) throw new Error('Invalid message type');
      return { messageType, template, success: true };
    } catch (error) {
      console.error('[MainAgent] Error getting message template:', error);
      return { error: `Failed to get template: ${error.message}`, success: false };
    }
  },
  {
    name: 'get_message_template',
    description: 'Retrieve template object for a specific message type',
    schema: {
      type: 'object',
      properties: {
        messageType: { type: 'string', enum: ['chatMessage', 'product', 'review', 'suggested', 'loading'] }
      },
      required: ['messageType']
    }
  }
);

const sendMessageTool = tool(
  async ({ message }, config) => {
    try {
      if (!message || !message.type || !message.id) {
        throw new Error('Message must have at least `id` and `type` fields');
      }

      if (message.type === 'product' && !message.displayType) {
        message.displayType = 'Box2';
      }

      const { writer } = config || {};

      if (writer) {
        // Send structured message data via web socket
        const sseMessage = message;
        writer(sseMessage);
        console.log(`[MainAgent] web socket Message sent: ${message.type}`);
      } else {
        console.log(`[MainAgent] Message sent: ${message.type} (no web socket stream available)`);
      }
      console.log(`[MainAgent] Message Content: ${JSON.stringify(message)}`);

      return {
        messageId: message.id,
        type: message.type,
        success: true,
        channel: writer ? 'sse' : 'console'
      };
    } catch (error) {
      console.error('[MainAgent] Error sending message:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  },
  {
    name: 'send_message',
    description: 'Send structured message to frontend via SSE. Supports dynamic message structures based on type.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'object',
          description: 'The message object to send. Must include `id` and `type`. Other properties depend on message type. review should select product type',
          properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: ['chatMessage', 'product', 'suggested', 'loading'] }
            // 나머지 필드는 동적이라 따로 명시하지 않음
          },
          required: ['id', 'type']
        }
      },
      required: ['message']
    }
  }
);

module.exports = {
  callProductAgentTool,
  getMessageTemplateTool,
  sendMessageTool,
  loadMessageTypeTemplates
};
