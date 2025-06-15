/**
 * SEO Head component for managing dynamic meta tags using React 19's native metadata support
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