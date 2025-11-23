/**
 * Simple Message Schema for Frontend Compatibility
 * Zod v3 호환 방식으로 구현
 */

const { z } = require('zod');

/**
 * 기본 메시지 필드들
 */
const BaseMessageSchema = z.object({
  id: z.string().or(z.number()).describe('고유 메시지 ID'),
  type: z.string().describe('메시지 타입'),
  timestamp: z.date().or(z.string()).describe('메시지 생성 시각')
});

/**
 * 일반 채팅 메시지 스키마
 * @typedef {Object} ChatMessage
 */
const ChatMessageSchema = BaseMessageSchema.extend({
  type: z.literal('chatMessage'),
  role: z.enum(['agent', 'user']).describe('메시지 발신자 역할'),
  content: z.string().describe('메시지 본문 내용')
});

/**
 * 제품 정보 메시지 스키마
 * @typedef {Object} ProductMessage
 */
const ProductMessageSchema = BaseMessageSchema.extend({
  type: z.literal('product'),
  products: z.array(z.object({
    id: z.string().or(z.number()),
    name: z.string(),
    price: z.number(),
    rating: z.number().min(0).max(5),
    image: z.string().url().optional(),
    detailLink: z.string().optional(),
    rank: z.number().optional(),
    reviews: z.array(z.object({
      text: z.string(),
      sentiment: z.enum(['Positive', 'Negative', 'Neutral']),
      features: z.array(z.string()).optional()
    })).optional()
  })).describe('제품 정보 배열'),
  displayType: z.enum(['Box1', 'Box2', 'review']).describe('제품 표시 형식')
});

/**
 * 추천 질문 메시지 스키마
 * @typedef {Object} SuggestedMessage
 */
const SuggestedMessageSchema = BaseMessageSchema.extend({
  type: z.literal('suggested'),
  suggestions: z.array(z.object({
    displayMessage: z.string().describe('화면에 표시될 텍스트'),
    message: z.string().describe('실제 전송될 메시지')
  })).describe('추천 질문 배열')
});

/**
 * 로딩 상태 메시지 스키마
 * @typedef {Object} LoadingMessage
 */
const LoadingMessageSchema = BaseMessageSchema.extend({
  type: z.literal('loading'),
  content: z.string().describe('로딩 상태 메시지')
});

/**
 * 메시지 유형별 스키마 맵
 */
const messageSchemas = {
  chatMessage: ChatMessageSchema,
  product: ProductMessageSchema,
  suggested: SuggestedMessageSchema,
  loading: LoadingMessageSchema
};

/**
 * 메시지 유효성 검증 함수
 * @param {Object} message - 검증할 메시지 객체
 * @param {string} expectedType - 예상 메시지 타입 (선택사항)
 * @returns {boolean} 유효성 검증 결과
 */
function validateMessage(message, expectedType = null) {
  try {
    if (expectedType && messageSchemas[expectedType]) {
      messageSchemas[expectedType].parse(message);
    } else if (message && message.type && messageSchemas[message.type]) {
      messageSchemas[message.type].parse(message);
    } else {
      return false; // Invalid message structure
    }
    return true;
  } catch (error) {
    console.error('Message validation failed:', error.message);
    return false;
  }
}

/**
 * 메시지 생성 헬퍼 함수들
 */
const messageHelpers = {
  /**
   * 채팅 메시지 생성
   */
  createChatMessage(content, role = 'agent') {
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'chatMessage',
      role,
      content,
      timestamp: new Date()
    };
  },

  /**
   * 제품 메시지 생성
   */
  createProductMessage(products, displayType = 'Box2') {
    return {
      id: `product_${Date.now()}`,
      type: 'product',
      products,
      displayType,
      timestamp: new Date()
    };
  },

  /**
   * 추천 질문 메시지 생성
   */
  createSuggestedMessage(suggestions) {
    return {
      id: `suggested_${Date.now()}`,
      type: 'suggested',
      suggestions,
      timestamp: new Date()
    };
  },

  /**
   * 로딩 메시지 생성
   */
  createLoadingMessage(content = 'AI thinking...') {
    return {
      id: `loading_${Date.now()}`,
      type: 'loading',
      content
    };
  }
};

module.exports = {
  // 스키마들
  ChatMessageSchema,
  ProductMessageSchema,
  SuggestedMessageSchema,
  LoadingMessageSchema,
  messageSchemas,

  // 유틸리티 함수들
  validateMessage,

  // 헬퍼 함수들
  messageHelpers
};
