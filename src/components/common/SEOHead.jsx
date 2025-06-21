import { useEffect } from 'react';

/**
 * SEO Head component for managing dynamic meta tags using direct DOM manipulation
 * @param {Object} props - SEO configuration object
 */
export default function SEOHead({ 
  title, 
  description, 
  keywords, 
  canonical, 
  openGraph, 
  twitter, 
  structuredData 
}) {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = title;
    }

    // Helper function to update or create meta tag
    const updateMetaTag = (selector, content, property = 'content') => {
      let meta = document.querySelector(selector);
      if (!meta) {
        meta = document.createElement('meta');
        if (selector.includes('[name=')) {
          meta.name = selector.match(/name="([^"]+)"/)[1];
        } else if (selector.includes('[property=')) {
          meta.property = selector.match(/property="([^"]+)"/)[1];
        }
        document.head.appendChild(meta);
      }
      meta[property] = content;
    };

    // Helper function to update or create link tag
    const updateLinkTag = (rel, href) => {
      let link = document.querySelector(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = href;
    };

    // Update primary meta tags
    updateMetaTag('meta[name="title"]', title);
    updateMetaTag('meta[name="description"]', description);
    if (keywords) updateMetaTag('meta[name="keywords"]', keywords);
    if (canonical) updateLinkTag('canonical', canonical);

    // Update Open Graph tags
    if (openGraph) {
      updateMetaTag('meta[property="og:type"]', openGraph.type || 'website');
      updateMetaTag('meta[property="og:url"]', openGraph.url);
      updateMetaTag('meta[property="og:title"]', openGraph.title);
      updateMetaTag('meta[property="og:description"]', openGraph.description);
      updateMetaTag('meta[property="og:image"]', openGraph.image);
      updateMetaTag('meta[property="og:site_name"]', openGraph.siteName);
    }

    // Update Twitter tags
    if (twitter) {
      updateMetaTag('meta[property="twitter:card"]', twitter.card);
      updateMetaTag('meta[property="twitter:url"]', twitter.url || canonical);
      updateMetaTag('meta[property="twitter:title"]', twitter.title);
      updateMetaTag('meta[property="twitter:description"]', twitter.description);
      updateMetaTag('meta[property="twitter:image"]', twitter.image);
      if (twitter.creator) updateMetaTag('meta[property="twitter:creator"]', twitter.creator);
    }

    // Update structured data
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]');
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }
  }, [title, description, keywords, canonical, openGraph, twitter, structuredData]);

  return null; // This component doesn't render anything
} 