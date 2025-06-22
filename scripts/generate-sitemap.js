#!/usr/bin/env node

import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const sitemapPath = join(publicDir, 'sitemap.xml');

// Load tools config directly
const toolsConfigPath = join(__dirname, '..', 'src', 'utils', 'toolsConfig.json');
const toolsConfig = JSON.parse(readFileSync(toolsConfigPath, 'utf8'));

// Simple sitemap generation for Node.js
function generateSitemapXML() {
  const baseUrl = 'https://russ.tools';
  const today = new Date().toISOString().split('T')[0];
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Add homepage
  xml += '  <url>\n';
  xml += `    <loc>${baseUrl}</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += '    <changefreq>weekly</changefreq>\n';
  xml += '    <priority>1.0</priority>\n';
  xml += '  </url>\n';
  
  // Add tool pages (excluding GitHub source)
  toolsConfig
    .filter(tool => tool.id !== 'github-source')
    .forEach(tool => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${tool.path}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    });
  
  xml += '</urlset>';
  return xml;
}

try {
  const sitemapContent = generateSitemapXML();
  writeFileSync(sitemapPath, sitemapContent, 'utf8');
  console.log('✅ Sitemap generated successfully at public/sitemap.xml');
} catch (error) {
  console.error('❌ Error generating sitemap:', error);
  process.exit(1);
}