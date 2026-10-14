/* Content model for content/site.json — the single source of truth for the public homepage.
   render.ts turns a Site into index.html + assets/js/content.js. */

export const LANGS = ['en', 'fr', 'nl'] as const;
export type Lang = (typeof LANGS)[number];

/** Translatable text. `en` is required; empty fr/nl fall back to English on the site.
 *  Text uses "rich-lite": *word* → purple italic, a line break → <br>. No raw HTML. */
export type L10n = { en: string; fr: string; nl: string };

export type ImageRef = {
  /** JPG/PNG path relative to the site root (always present — the universal fallback). */
  src: string;
  /** Optional WebP version produced by the CMS uploader. */
  webp?: string;
  alt: string;
};

export type MobileVariant = 'classic' | 'cinematic';

export type NavEntry = { show: boolean; label: L10n };

type SectionBase = { id: string; visible: boolean; nav: NavEntry };

export type AboutSection = SectionBase & {
  type: 'about';
  label: L10n; title: L10n; paragraphs: { id: string; text: L10n }[]; quote: L10n;
  stats: { id: string; value: string; label: L10n }[];
  imageMain: ImageRef; imageSide: ImageRef;
};
export type ProcessSection = SectionBase & {
  type: 'process';
  label: L10n; title: L10n;
  steps: { id: string; title: L10n; desc: L10n }[];
};
export type ServicesSection = SectionBase & {
  type: 'services';
  label: L10n; title: L10n; intro: L10n;
  items: { id: string; name: L10n; desc: L10n }[];
};
export type PhotoQuoteSection = SectionBase & {
  type: 'photoQuote';
  heading: L10n; sub: L10n; image: ImageRef;
};
export type GallerySection = SectionBase & {
  type: 'gallery';
  label: L10n; title: L10n;
  images: ({ id: string } & ImageRef)[];
};
export type TeamSection = SectionBase & {
  type: 'team';
  label: L10n; title: L10n;
  members: { id: string; name: string; role: L10n; bio: L10n; photo: ImageRef }[];
};
export type WhySection = SectionBase & {
  type: 'why';
  label: L10n; title: L10n;
  items: { id: string; icon: string; title: L10n; desc: L10n }[];
  imageA: ImageRef; imageB: ImageRef;
  badgeValue: string; badgeLabel: L10n;
};
export type ContactSection = SectionBase & {
  type: 'contact';
  label: L10n; title: L10n; intro: L10n; location: L10n;
  form: {
    firstName: L10n; lastName: L10n; email: L10n; phone: L10n; message: L10n;
    submit: L10n; sent: L10n;
  };
};

export type Section =
  | AboutSection | ProcessSection | ServicesSection | PhotoQuoteSection
  | GallerySection | TeamSection | WhySection | ContactSection;
export type SectionType = Section['type'];

export type Site = {
  version: 1;
  settings: { mobileVariant: MobileVariant };
  seo: {
    title: L10n; description: L10n; keywords: string;
    ogImage: string; siteUrl: string;
  };
  contact: {
    email: string; phoneDisplay: string; phoneHref: string;
    instagram: string; instagramHandle: string; city: string; country: string;
  };
  brand: { logo: string; loaderLogo: string; loaderText: L10n };
  hero: {
    eyebrow: L10n; title: L10n; sub: L10n; cta1: L10n; cta2: L10n; scroll: L10n;
    background: ImageRef; backgroundLayer2: ImageRef; floatImage: ImageRef;
  };
  marquee: { visible: boolean; items: { id: string; text: L10n }[] };
  /** Ordered list — the CMS lets the client reorder, hide and add photo-quote blocks. */
  sections: Section[];
  /** "Enquire" call-to-action at the end of the nav; points at the contact section. */
  navCta: L10n;
  footer: {
    tagline: L10n; navHeading: L10n; servicesHeading: L10n; contactHeading: L10n; rights: L10n;
  };
};

export const SECTION_TYPE_NAMES: Record<SectionType, string> = {
  about: 'About',
  process: 'How We Work',
  services: 'Services',
  photoQuote: 'Photo quote',
  gallery: 'Gallery',
  team: 'Team',
  why: 'Why Choose Us',
  contact: 'Contact',
};

export function emptyL10n(en = ''): L10n {
  return { en, fr: '', nl: '' };
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 8);
}
