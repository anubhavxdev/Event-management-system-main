import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * Reusable SEO component for managing page metadata
 * @param {string} title - Page title
 * @param {string} description - Page meta description
 * @param {string} ogImage - Open Graph image URL (optional)
 * @param {string} url - Page URL (optional, auto-detected)
 */
const SEO = ({ title, description, ogImage, url = '' }) => {
  // Get site URL from environment or current window origin
  const siteUrl = import.meta.env.VITE_SITE_URL?.replace(/\/$/, '') || (typeof window !== 'undefined' ? window.location.origin : '');
  const path = url || (typeof window !== 'undefined' ? window.location.pathname : '');
  const fullUrl = siteUrl && path ? `${siteUrl}${path}` : siteUrl || path;
  
  // Build absolute image URL (prefer provided image, fallback to public image)
  const absoluteOgImage = ogImage ? (ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`) : `${siteUrl}/Mvpblocks.webp`;
  const appName = 'eventone';

  return (
    <Helmet>
      <title>{title} | {appName}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteOgImage} />
      <meta property="og:site_name" content={appName} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteOgImage} />
      
      {/* Additional metadata */}
      <meta name="application-name" content={appName} />
      <meta name="apple-mobile-web-app-title" content={appName} />
    </Helmet>
  );
};

export default SEO;
