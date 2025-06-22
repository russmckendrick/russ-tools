// Buzzword API Cloudflare Worker
// Provides buzzword generation services with rate limiting and CORS support

// Import buzzwords from the source file
import BUZZWORDS from '../src/components/tools/buzzword-placeholder/data/buzzwords.json';

// Rate limiting configuration
const RATE_LIMITS = {
  PER_MINUTE: 30,
  PER_HOUR: 250,
  PER_DAY: 500
};

class RateLimiter {
  constructor(env) {
    this.kv = env.BUZZWORDS_RATE_LIMIT;
  }

  async checkLimit(clientId, timeWindow, limit) {
    const now = Date.now();
    const windowStart = this.getWindowStart(now, timeWindow);
    const key = `${clientId}:${timeWindow}:${windowStart}`;
    
    const current = await this.kv.get(key);
    const count = current ? parseInt(current) + 1 : 1;
    
    if (count > limit) {
      return { allowed: false, count, limit };
    }
    
    await this.kv.put(key, count.toString(), { 
      expirationTtl: this.getTtl(timeWindow) 
    });
    
    return { allowed: true, count, limit };
  }

  getWindowStart(timestamp, timeWindow) {
    switch (timeWindow) {
      case 'minute':
        return Math.floor(timestamp / 60000) * 60000;
      case 'hour':
        return Math.floor(timestamp / 3600000) * 3600000;
      case 'day':
        return Math.floor(timestamp / 86400000) * 86400000;
      default:
        return timestamp;
    }
  }

  getTtl(timeWindow) {
    switch (timeWindow) {
      case 'minute':
        return 120; // 2 minutes
      case 'hour':
        return 7200; // 2 hours
      case 'day':
        return 172800; // 2 days
      default:
        return 3600;
    }
  }
}

function getClientId(request) {
  const clientIP = request.headers.get('CF-Connecting-IP') || 
                  request.headers.get('X-Forwarded-For') || 
                  request.headers.get('X-Real-IP') || 
                  'unknown';
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  return `${clientIP}:${btoa(userAgent).slice(0, 10)}`;
}

function createCorsHeaders(origin) {
  const allowedOrigins = [
    'https://russ.tools',
    'https://www.russ.tools',
    'http://localhost:5173',
    'http://localhost:3000'
  ];

  const corsOrigin = allowedOrigins.includes(origin) ? origin : 'https://russ.tools';

  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Expose-Headers': 'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset'
  };
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateBuzzwordPhrase(count = 1) {
  const phrases = [];
  
  for (let i = 0; i < count; i++) {
    const adverb = getRandomElement(BUZZWORDS.adverbs);
    const verb = getRandomElement(BUZZWORDS.verbs);
    const adjective = getRandomElement(BUZZWORDS.adjectives);
    const noun = getRandomElement(BUZZWORDS.nouns);
    
    phrases.push(`${adverb} ${verb} ${adjective} ${noun}`);
  }
  
  return phrases;
}

function generateBuzzwordList(type, count = 10) {
  if (!BUZZWORDS[type]) {
    throw new Error(`Invalid buzzword type: ${type}`);
  }
  
  const words = [...BUZZWORDS[type]];
  const result = [];
  
  for (let i = 0; i < Math.min(count, words.length); i++) {
    const randomIndex = Math.floor(Math.random() * words.length);
    result.push(words.splice(randomIndex, 1)[0]);
  }
  
  return result;
}

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');
  const corsHeaders = createCorsHeaders(origin);

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  // Rate limiting
  const rateLimiter = new RateLimiter(env);
  const clientId = getClientId(request);
  
  const minuteCheck = await rateLimiter.checkLimit(clientId, 'minute', RATE_LIMITS.PER_MINUTE);
  const hourCheck = await rateLimiter.checkLimit(clientId, 'hour', RATE_LIMITS.PER_HOUR);
  const dayCheck = await rateLimiter.checkLimit(clientId, 'day', RATE_LIMITS.PER_DAY);
  
  if (!minuteCheck.allowed || !hourCheck.allowed || !dayCheck.allowed) {
    const resetTime = Math.floor(Date.now() / 1000) + 60;
    
    return new Response(JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      limits: {
        perMinute: RATE_LIMITS.PER_MINUTE,
        perHour: RATE_LIMITS.PER_HOUR,
        perDay: RATE_LIMITS.PER_DAY
      }
    }), {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': RATE_LIMITS.PER_MINUTE.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetTime.toString(),
        'Retry-After': '60'
      }
    });
  }

  // Add rate limit headers
  const rateLimitHeaders = {
    'X-RateLimit-Limit': RATE_LIMITS.PER_MINUTE.toString(),
    'X-RateLimit-Remaining': (RATE_LIMITS.PER_MINUTE - minuteCheck.count).toString(),
    'X-RateLimit-Reset': Math.floor(Date.now() / 1000 + 60).toString()
  };

  try {
    switch (url.pathname) {
      case '/health':
        return new Response(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          uptime: Date.now() - (env.START_TIME || Date.now()),
          services: {
            buzzwords: 'operational',
            rateLimit: 'operational',
            cors: 'enabled'
          },
          wordCounts: {
            adverbs: BUZZWORDS.adverbs.length,
            adjectives: BUZZWORDS.adjectives.length,
            nouns: BUZZWORDS.nouns.length,
            verbs: BUZZWORDS.verbs.length
          }
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            ...rateLimitHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });

      case '/generate':
        if (request.method !== 'GET' && request.method !== 'POST') {
          return new Response(JSON.stringify({
            error: 'Method not allowed',
            message: 'Use GET or POST method'
          }), {
            status: 405,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }

        let params = {};
        if (request.method === 'POST') {
          try {
            params = await request.json();
          } catch (e) {
            return new Response(JSON.stringify({
              error: 'Invalid JSON',
              message: 'Request body must be valid JSON'
            }), {
              status: 400,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            });
          }
        } else {
          // GET request - extract from query parameters
          const searchParams = url.searchParams;
          params.count = parseInt(searchParams.get('count')) || 1;
          params.type = searchParams.get('type') || 'phrase';
        }

        const count = Math.min(Math.max(parseInt(params.count) || 1, 1), 50);
        const type = params.type || 'phrase';

        let result;
        if (type === 'phrase') {
          result = {
            type: 'phrases',
            count: count,
            data: generateBuzzwordPhrase(count)
          };
        } else if (['adverbs', 'adjectives', 'nouns', 'verbs'].includes(type)) {
          result = {
            type: type,
            count: count,
            data: generateBuzzwordList(type, count)
          };
        } else {
          return new Response(JSON.stringify({
            error: 'Invalid type',
            message: 'Type must be one of: phrase, adverbs, adjectives, nouns, verbs'
          }), {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }

        return new Response(JSON.stringify({
          success: true,
          timestamp: new Date().toISOString(),
          ...result
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            ...rateLimitHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300'
          }
        });

      case '/words':
        const wordType = url.searchParams.get('type');
        const wordCount = Math.min(Math.max(parseInt(url.searchParams.get('count')) || 10, 1), 100);

        if (wordType && !BUZZWORDS[wordType]) {
          return new Response(JSON.stringify({
            error: 'Invalid word type',
            message: 'Type must be one of: adverbs, adjectives, nouns, verbs',
            availableTypes: Object.keys(BUZZWORDS)
          }), {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }

        const wordsResult = wordType 
          ? { [wordType]: generateBuzzwordList(wordType, wordCount) }
          : {
              adverbs: generateBuzzwordList('adverbs', Math.min(wordCount, 10)),
              adjectives: generateBuzzwordList('adjectives', Math.min(wordCount, 10)),
              nouns: generateBuzzwordList('nouns', Math.min(wordCount, 10)),
              verbs: generateBuzzwordList('verbs', Math.min(wordCount, 10))
            };

        return new Response(JSON.stringify({
          success: true,
          timestamp: new Date().toISOString(),
          ...wordsResult
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            ...rateLimitHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=1800'
          }
        });

      default:
        return new Response(JSON.stringify({
          error: 'Not found',
          message: 'Endpoint not found',
          availableEndpoints: [
            'GET /health - Health check',
            'GET/POST /generate - Generate buzzword phrases',
            'GET /words - Get buzzword lists'
          ]
        }), {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
    }
  } catch (error) {
    console.error('Worker error:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  }
};