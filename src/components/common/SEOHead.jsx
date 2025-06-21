import { useEffect } from 'react';

/**
 * SEO Head component for managing dynamic meta tags with hybrid approach:
 * - useEffect for immediate DOM updates (works for SEO crawlers and browsers)
 * - React 19 metadata for future compatibility
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
    console.log('SEOHead useEffect running with title:', title);
    
    // Helper function to update or create meta tag
    const updateMetaTag = (selector, content) => {
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
      meta.content = content;
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

    // Update document title
    if (title) {
      console.log('Updating document.title to:', title);
      document.title = title;
    }

    // Update primary meta tags
    if (title) {
      console.log('Updating title meta tag to:', title);
      updateMetaTag('meta[name="title"]', title);
    }
    if (description) {
      console.log('Updating description meta tag to:', description);
      updateMetaTag('meta[name="description"]', description);
    }
    if (keywords) {
      console.log('Updating keywords meta tag to:', keywords);
      updateMetaTag('meta[name="keywords"]', keywords);
    }
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

  // React 19 metadata for future compatibility
  return (
    <>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph / Facebook */}
      {openGraph && (
        <>
          <meta property="og:type" content={openGraph.type || 'website'} />
          <meta property="og:url" content={openGraph.url} />
          <meta property="og:title" content={openGraph.title} />
          <meta property="og:description" content={openGraph.description} />
          <meta property="og:image" content={openGraph.image} />
          <meta property="og:site_name" content={openGraph.siteName} />
        </>
      )}
      
      {/* Twitter */}
      {twitter && (
        <>
          <meta property="twitter:card" content={twitter.card} />
          <meta property="twitter:url" content={twitter.url || canonical} />
          <meta property="twitter:title" content={twitter.title} />
          <meta property="twitter:description" content={twitter.description} />
          <meta property="twitter:image" content={twitter.image} />
          {twitter.creator && <meta property="twitter:creator" content={twitter.creator} />}
        </>
      )}
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </>
  );
} 