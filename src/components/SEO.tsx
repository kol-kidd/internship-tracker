import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
}

const DEFAULT_TITLE = "InternPal | Smart Internship Tracker & AI Journal";
const DEFAULT_DESCRIPTION =
  "Master your internship search with InternPal. Track applications, log daily insights, and leverage Gemini AI to refine your professional journal.";
const DEFAULT_KEYWORDS =
  "internship tracker, internship journal, career management, AI journal, professional growth, internship search tool";
const DEFAULT_OG_IMAGE = "/og-image.png";

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
  canonicalUrl,
}: SEOProps) {
  const fullTitle = title ? `${title} | InternPal` : DEFAULT_TITLE;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Helper to update or create meta tags
    const updateMetaTag = (
      attribute: "name" | "property",
      key: string,
      content: string,
    ) => {
      let element = document.querySelector(
        `meta[${attribute}="${key}"]`,
      ) as HTMLMetaElement | null;

      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    // Update meta tags
    updateMetaTag("name", "description", description);
    updateMetaTag("name", "keywords", keywords);

    // Open Graph tags
    updateMetaTag("property", "og:title", fullTitle);
    updateMetaTag("property", "og:description", description);
    updateMetaTag("property", "og:image", ogImage);
    updateMetaTag("property", "og:type", ogType);

    // Twitter Card tags
    updateMetaTag("name", "twitter:card", "summary_large_image");
    updateMetaTag("name", "twitter:title", fullTitle);
    updateMetaTag("name", "twitter:description", description);
    updateMetaTag("name", "twitter:image", ogImage);

    // Canonical URL
    if (canonicalUrl) {
      let link = document.querySelector(
        'link[rel="canonical"]',
      ) as HTMLLinkElement | null;

      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = canonicalUrl;
    }

    // Cleanup function (optional - restore defaults on unmount)
    return () => {
      // We don't clean up to avoid flashing, next page will update
    };
  }, [fullTitle, description, keywords, ogImage, ogType, canonicalUrl]);

  return null;
}
