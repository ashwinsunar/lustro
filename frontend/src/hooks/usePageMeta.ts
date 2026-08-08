import { useEffect } from 'react';

const SITE_NAME = 'Lustro';
const SITE_DESCRIPTION =
  "Curating the world's most exceptional timepieces. Complimentary insured shipping, 14-day returns.";

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

interface PageMetaOptions {
  title: string;
  description?: string;
  /** absolute path within the site, e.g. /watch/rolex-submariner */
  path?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
}

export function usePageMeta({ title, description = SITE_DESCRIPTION, path = '/', image, type = 'website' }: PageMetaOptions) {
  useEffect(() => {
    const fullTitle = title === SITE_NAME ? title : `${title} — ${SITE_NAME}`;
    const url = `${window.location.origin}${path}`;

    document.title = fullTitle;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:site_name', SITE_NAME);
    if (image) setMeta('property', 'og:image', image);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setLink('canonical', url);
  }, [title, description, path, image, type]);
}
