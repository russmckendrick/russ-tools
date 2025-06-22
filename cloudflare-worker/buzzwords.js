// Buzzword API Cloudflare Worker
// Provides buzzword generation services with rate limiting and CORS support

// Import buzzwords from the source file
import BUZZWORDS from '../src/components/tools/buzzword-ipsum/data/buzzwords.json';

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

function generateBuzzwordSentences(count = 1) {
  const sentences = [];
  
  for (let i = 0; i < count; i++) {
    const adverb = getRandomElement(BUZZWORDS.adverbs);
    const verb = getRandomElement(BUZZWORDS.verbs);
    const adjective = getRandomElement(BUZZWORDS.adjectives);
    const noun = getRandomElement(BUZZWORDS.nouns);
    
    const sentence = `${adverb.charAt(0).toUpperCase() + adverb.slice(1)} ${verb} ${adjective} ${noun}.`;
    sentences.push(sentence);
  }
  
  return sentences;
}

function generateBuzzwordParagraphs(count = 1) {
  const paragraphs = [];
  
  for (let i = 0; i < count; i++) {
    const sentenceCount = Math.floor(Math.random() * 3) + 3; // 3-5 sentences per paragraph
    const sentences = [];
    
    for (let j = 0; j < sentenceCount; j++) {
      const adverb = getRandomElement(BUZZWORDS.adverbs);
      const verb = getRandomElement(BUZZWORDS.verbs);
      const adjective1 = getRandomElement(BUZZWORDS.adjectives);
      const noun1 = getRandomElement(BUZZWORDS.nouns);
      
      // Add some variety with additional clauses
      if (Math.random() > 0.5) {
        const verb2 = getRandomElement(BUZZWORDS.verbs);
        const adjective2 = getRandomElement(BUZZWORDS.adjectives);
        const noun2 = getRandomElement(BUZZWORDS.nouns);
        
        const sentence = `${adverb.charAt(0).toUpperCase() + adverb.slice(1)} ${verb} ${adjective1} ${noun1} while ${verb2} ${adjective2} ${noun2}.`;
        sentences.push(sentence);
      } else {
        const sentence = `${adverb.charAt(0).toUpperCase() + adverb.slice(1)} ${verb} ${adjective1} ${noun1}.`;
        sentences.push(sentence);
      }
    }
    
    paragraphs.push(sentences.join(' '));
  }
  
  return paragraphs;
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

export default {
  async fetch(request, env) {
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

    try {
      switch (url.pathname) {
        case '/health':
          return new Response(JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
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
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });

        case '/generate':
          if (request.method !== 'GET' && request.method !== 'POST') {
            return new Response(JSON.stringify({
              error: 'Method not allowed'
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
                error: 'Invalid JSON'
              }), {
                status: 400,
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'application/json'
                }
              });
            }
          } else {
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
          } else if (type === 'sentences') {
            result = {
              type: 'sentences',
              count: count,
              data: generateBuzzwordSentences(count)
            };
          } else if (type === 'paragraphs') {
            result = {
              type: 'paragraphs',
              count: count,
              data: generateBuzzwordParagraphs(count)
            };
          } else if (['adverbs', 'adjectives', 'nouns', 'verbs'].includes(type)) {
            result = {
              type: type,
              count: count,
              data: generateBuzzwordList(type, count)
            };
          } else {
            return new Response(JSON.stringify({
              error: 'Invalid type. Supported types: phrase, sentences, paragraphs, adverbs, adjectives, nouns, verbs'
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
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=300'
            }
          });

        case '/words':
          const wordType = url.searchParams.get('type');
          const wordCount = Math.min(Math.max(parseInt(url.searchParams.get('count')) || 10, 1), 100);

          if (wordType && !BUZZWORDS[wordType]) {
            return new Response(JSON.stringify({
              error: 'Invalid word type. Supported types: adverbs, adjectives, nouns, verbs'
            }), {
              status: 400,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            });
          }

          const wordsResult = wordType
            ? {
              [wordType]: generateBuzzwordList(wordType, wordCount)
            }
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
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=1800'
            }
          });

        default:
          return new Response(JSON.stringify({
            error: 'Not found'
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
        error: 'Internal server error'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  }
};