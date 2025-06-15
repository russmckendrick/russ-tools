import { getTools } from './toolsUtils.js';
import { generateSitemapData } from './seoUtils.js';

/**
 * Generate XML sitemap content
 * @returns {string} XML sitemap content
 */
export function generateSitemapXML() {
  const tools = getTools(false); // Exclude GitHub link
  const sitemapData = generateSitemapData(tools);
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  sitemapData.forEach(entry => {
    xml += '  <url>\n';
    xml += `    <loc>${entry.url}</loc>\n`;
    xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
    xml += `    <priority>${entry.priority}</priority>\n`;
    xml += '  </url>\n';
  });
  
  xml += '</urlset>';
  
  return xml;
}

// Generate and log sitemap for manual creation
if (typeof window === 'undefined') {
  console.log(generateSitemapXML());
} 