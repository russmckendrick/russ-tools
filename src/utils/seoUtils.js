/**
 * SEO utility functions for managing dynamic meta tags and structured data
 */

/**
 * Generate SEO meta data for tool pages
 * @param {Object} tool - Tool configuration object
 * @returns {Object} SEO meta data object
 */
export function generateToolSEO(tool) {
  const baseUrl = 'https://russ.tools';
  const toolUrl = `${baseUrl}${tool.path}`;
  
  return {
    title: `${tool.title} - Free Online Tool | RussTools`,
    description: tool.description,
    keywords: [
      ...tool.badges.map(badge => badge.toLowerCase()),
      tool.title.toLowerCase(),
      'free tool',
      'online tool',
      'developer tool',
      'devops tool'
    ].join(', '),
    canonical: toolUrl,
    openGraph: {
      title: `${tool.title} - Free Online Tool | RussTools`,
      description: tool.description,
      url: toolUrl,
      type: 'website',
      image: `${baseUrl}/og-image.png`,
      siteName: 'RussTools'
    },
    twitter: {
      card: 'summary_large_image',
      title: `${tool.title} - Free Online Tool | RussTools`,
      description: tool.description,
      image: `${baseUrl}/og-image.png`,
      creator: '@russmckendrick'
    },
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: tool.title,
      url: toolUrl,
      description: tool.description,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      author: {
        '@type': 'Person',
        name: 'Russ McKendrick',
        url: 'https://github.com/russmckendrick'
      },
      publisher: {
        '@type': 'Person',
        name: 'Russ McKendrick'
      },
      featureList: tool.badges,
      isPartOf: {
        '@type': 'WebSite',
        name: 'RussTools',
        url: 'https://russ.tools'
      }
    }
  };
}

/**
 * Generate home page SEO data
 * @returns {Object} Home page SEO meta data
 */
export function generateHomeSEO() {
  const baseUrl = 'https://russ.tools';
  
  return {
    title: 'RussTools - Free Online Developer & DevOps Tools Collection',
    description: 'Free collection of developer and DevOps tools including Network Designer, Azure Naming Tool, SSL Checker, DNS Lookup, JWT Decoder, Base64 Encoder, Password Generator and more. All tools work client-side for privacy and security.',
    keywords: 'developer tools, devops tools, network designer, azure naming, ssl checker, dns lookup, jwt decoder, base64 encoder, password generator, cron builder, whois lookup, microsoft portals, tenant lookup, free tools, online tools',
    canonical: baseUrl,
    openGraph: {
      title: 'RussTools - Free Online Developer & DevOps Tools Collection',
      description: 'Free collection of developer and DevOps tools including Network Designer, Azure Naming Tool, SSL Checker, DNS Lookup, JWT Decoder, Base64 Encoder, Password Generator and more. All tools work client-side for privacy and security.',
      url: baseUrl,
      type: 'website',
      image: `${baseUrl}/og-image.png`,
      siteName: 'RussTools'
    },
    twitter: {
      card: 'summary_large_image',
      title: 'RussTools - Free Online Developer & DevOps Tools Collection',
      description: 'Free collection of developer and DevOps tools including Network Designer, Azure Naming Tool, SSL Checker, DNS Lookup, JWT Decoder, Base64 Encoder, Password Generator and more. All tools work client-side for privacy and security.',
      image: `${baseUrl}/og-image.png`,
      creator: '@russmckendrick'
    }
  };
}

/**
 * Generate sitemap data for all tools
 * @param {Array} tools - Array of tool configuration objects
 * @returns {Array} Sitemap entries
 */
export function generateSitemapData(tools) {
  const baseUrl = 'https://russ.tools';
  const currentDate = new Date().toISOString().split('T')[0];
  
  const sitemapEntries = [
    {
      url: baseUrl,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '1.0'
    }
  ];
  
  // Add tool pages
  tools.forEach(tool => {
    if (tool.path.startsWith('/')) {
      sitemapEntries.push({
        url: `${baseUrl}${tool.path}`,
        lastmod: currentDate,
        changefreq: 'monthly',
        priority: '0.8'
      });
    }
  });
  
  return sitemapEntries;
}

/**
 * Generate robots.txt content
 * @returns {string} Robots.txt content
 */
export function generateRobotsTxt() {
  return `User-agent: *
Allow: /

# Sitemap
Sitemap: https://russ.tools/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1`;
} 