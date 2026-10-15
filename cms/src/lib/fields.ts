/* Declarative editor definitions: which fields each panel / section type shows.
   Editor.svelte renders these generically, so adding a field is one line here. */

import type { ImageKind } from './image.ts';
import { emptyL10n, newId, type ImageRef, type SectionType } from './schema.ts';

export type Field =
  /** translatable text (L10n) */
  | { kind: 'text'; key: string; label: string; multiline?: boolean; rich?: boolean; help?: string }
  /** single-language string */
  | { kind: 'plain'; key: string; label: string; help?: string; type?: 'text' | 'email' | 'url' }
  /** ImageRef object at obj[key] (or obj itself when key is '') */
  | { kind: 'image'; key: string; label: string; size: ImageKind; noAlt?: boolean; help?: string }
  /** plain path string at obj[key] (logo) */
  | { kind: 'imagePath'; key: string; label: string; size: ImageKind; help?: string }
  | { kind: 'toggle'; key: string; label: string; help?: string }
  | {
      kind: 'list'; key: string; label: string; itemName: string;
      /** heading shown on each collapsed item */
      title: (item: any, i: number) => string;
      fields: Field[];
      /** create an empty item (text lists) */
      make?: () => any;
      /** image lists: "Add" opens a file picker and builds items from the uploaded images */
      fromImage?: { size: ImageKind; make: (img: ImageRef) => any; multiple?: boolean };
      min?: number;
    };

const RICH_HELP = 'Tip: *word* shows in purple italic. A new line becomes a line break.';
const T = (key: string, label: string, extra: Partial<Extract<Field, { kind: 'text' }>> = {}): Field => ({ kind: 'text', key, label, ...extra });
const TL = (key: string, label: string): Field => T(key, label, { multiline: true });
const TITLE = (key = 'title', label = 'Title'): Field => T(key, label, { rich: true, help: RICH_HELP });
const en = (v: { en?: string } | undefined) => (v?.en ?? '').replace(/\*/g, '').replace(/\n/g, ' ');

export const NAV_FIELDS: Field[] = [
  { kind: 'toggle', key: 'show', label: 'Show in the menu' },
  T('label', 'Menu label'),
];

export const SECTION_FIELDS: Record<SectionType, Field[]> = {
  about: [
    T('label', 'Small label'), TITLE(),
    { kind: 'list', key: 'paragraphs', label: 'Paragraphs', itemName: 'paragraph', title: (p, i) => `Paragraph ${i + 1}`, fields: [TL('text', 'Text')], make: () => ({ id: newId(), text: emptyL10n() }) },
    TL('quote', 'Pull quote'),
    {
      kind: 'list', key: 'stats', label: 'Stat boxes', itemName: 'stat', title: (s) => s.value || 'New stat',
      fields: [{ kind: 'plain', key: 'value', label: 'Value', help: 'e.g. Brussels, 100%, 250+' }, T('label', 'Caption')],
      make: () => ({ id: newId(), value: '', label: emptyL10n() }),
    },
    { kind: 'image', key: 'imageMain', label: 'Photo (left)', size: 'medium' },
    { kind: 'image', key: 'imageSide', label: 'Photo (right)', size: 'medium' },
  ],
  process: [
    T('label', 'Small label'), TITLE(),
    {
      kind: 'list', key: 'steps', label: 'Steps', itemName: 'step', title: (s, i) => `${i + 1}. ${en(s.title) || 'New step'}`,
      fields: [T('title', 'Step title'), TL('desc', 'Description')],
      make: () => ({ id: newId(), title: emptyL10n(), desc: emptyL10n() }), min: 1,
    },
  ],
  services: [
    T('label', 'Small label'), TITLE(), TL('intro', 'Intro text'),
    {
      kind: 'list', key: 'items', label: 'Services', itemName: 'service', title: (s, i) => `${i + 1}. ${en(s.name) || 'New service'}`,
      fields: [T('name', 'Name'), TL('desc', 'Description')],
      make: () => ({ id: newId(), name: emptyL10n(), desc: emptyL10n() }), min: 1,
    },
  ],
  photoQuote: [
    T('heading', 'Quote', { multiline: true, rich: true, help: RICH_HELP }),
    T('sub', 'Small line under the quote'),
    { kind: 'image', key: 'image', label: 'Background photo', size: 'hero', noAlt: true },
  ],
  gallery: [
    T('label', 'Small label'), TITLE(),
    {
      kind: 'list', key: 'images', label: 'Photos', itemName: 'photo', title: (im, i) => `Photo ${i + 1}`,
      fields: [{ kind: 'image', key: '', label: 'Photo', size: 'large', help: 'The description (alt text) is read by search engines and screen readers.' }],
      fromImage: { size: 'large', multiple: true, make: (img) => ({ id: newId(), ...img }) },
    },
  ],
  team: [
    T('label', 'Small label'), TITLE(),
    {
      kind: 'list', key: 'members', label: 'Team members', itemName: 'member', title: (m) => m.name || 'New member',
      fields: [
        { kind: 'plain', key: 'name', label: 'Name' }, T('role', 'Role'), TL('bio', 'Bio (shown on hover)'),
        { kind: 'image', key: 'photo', label: 'Photo', size: 'medium' },
      ],
      make: () => ({ id: newId(), name: '', role: emptyL10n(), bio: emptyL10n(), photo: { src: '', alt: '' } }),
    },
  ],
  why: [
    T('label', 'Small label'), TITLE(),
    {
      kind: 'list', key: 'items', label: 'Reasons', itemName: 'reason', title: (w) => en(w.title) || 'New reason',
      fields: [{ kind: 'plain', key: 'icon', label: 'Icon symbol', help: 'A single character, e.g. ◈ ◎ ◇ △' }, T('title', 'Title'), TL('desc', 'Description')],
      make: () => ({ id: newId(), icon: '◇', title: emptyL10n(), desc: emptyL10n() }),
    },
    { kind: 'image', key: 'imageA', label: 'Large photo', size: 'medium' },
    { kind: 'image', key: 'imageB', label: 'Small photo', size: 'medium' },
    { kind: 'plain', key: 'badgeValue', label: 'Badge text' }, T('badgeLabel', 'Badge caption'),
  ],
  contact: [
    T('label', 'Small label'), TITLE(), TL('intro', 'Intro text'), T('location', 'Location line'),
    T('form.firstName', 'Form: first name'), T('form.lastName', 'Form: last name'), T('form.email', 'Form: email'),
    T('form.phone', 'Form: phone'), T('form.message', 'Form: message'), T('form.submit', 'Form: send button'),
    T('form.sent', 'Form: “sent” confirmation'),
  ],
};

/** `path` is the object the fields edit; `countPath` (default: path) scopes the missing-translation badge. */
export type Panel = { id: string; name: string; desc: string; path: string; countPath?: string; fields: Field[] };

/** Fixed (non-section) panels. `path` points into Site. */
export const PANELS: Panel[] = [
  {
    id: 'hero', name: 'Hero', desc: 'The first screen visitors see.', path: 'hero',
    fields: [
      T('eyebrow', 'Small line above the title'), T('title', 'Headline', { multiline: true, rich: true, help: RICH_HELP }),
      TL('sub', 'Sub-headline'), T('cta1', 'Button 1 (goes to contact)'), T('cta2', 'Button 2 (goes to gallery)'), T('scroll', 'Scroll hint'),
      { kind: 'image', key: 'floatImage', label: 'Feature photo (right side on desktop, full screen in the cinematic mobile layout)', size: 'hero' },
      { kind: 'image', key: 'background', label: 'Background', size: 'hero', noAlt: true },
      { kind: 'image', key: 'backgroundLayer2', label: 'Background (texture layer)', size: 'hero', noAlt: true },
    ],
  },
  {
    id: 'marquee', name: 'Scrolling banner', desc: 'The moving strip of keywords under the hero.', path: 'marquee',
    fields: [
      { kind: 'toggle', key: 'visible', label: 'Show the scrolling banner' },
      { kind: 'list', key: 'items', label: 'Keywords', itemName: 'keyword', title: (m) => en(m.text) || 'New keyword', fields: [T('text', 'Keyword')], make: () => ({ id: newId(), text: emptyL10n() }) },
    ],
  },
  {
    id: 'contactInfo', name: 'Contact details', desc: 'Used in the contact section, footer, form and search-engine data.', path: 'contact',
    fields: [
      { kind: 'plain', key: 'email', label: 'Email address', type: 'email', help: 'Enquiry form submissions are sent here too.' },
      { kind: 'plain', key: 'phoneDisplay', label: 'Phone (as shown)', help: 'e.g. +32 456 95 19 69' },
      { kind: 'plain', key: 'phoneHref', label: 'Phone (for the call link)', help: 'No spaces, e.g. +3245695169' },
      { kind: 'plain', key: 'instagram', label: 'Instagram URL', type: 'url' },
      { kind: 'plain', key: 'instagramHandle', label: 'Instagram handle', help: 'e.g. @goosebumpsevents.eu' },
      { kind: 'plain', key: 'city', label: 'City' },
    ],
  },
  {
    id: 'brand', name: 'Logo & loading screen', desc: '', path: 'brand',
    fields: [
      { kind: 'imagePath', key: 'logo', label: 'Logo (menu & footer)', size: 'logo' },
      { kind: 'imagePath', key: 'loaderLogo', label: 'Loading-screen logo', size: 'logo' },
      T('loaderText', 'Loading-screen text'),
    ],
  },
  {
    id: 'seo', name: 'Search & sharing', desc: 'How the site appears in Google and when shared on social media.', path: 'seo',
    fields: [
      T('title', 'Page title', { help: 'Shown in the browser tab and as the Google headline. Aim for under 65 characters.' }),
      TL('description', 'Description', ),
      { kind: 'plain', key: 'keywords', label: 'Keywords', help: 'Comma-separated. Minor ranking signal.' },
      { kind: 'imagePath', key: 'ogImage', label: 'Social share image', size: 'large', help: 'Shown when the link is shared (1200×630 works best).' },
    ],
  },
  {
    id: 'footer', name: 'Footer', desc: '', path: 'footer',
    fields: [TL('tagline', 'Tagline'), T('navHeading', 'Heading: navigation'), T('servicesHeading', 'Heading: services'), T('contactHeading', 'Heading: contact'), T('rights', 'Copyright text')],
  },
  {
    id: 'legal', name: 'Privacy & legal', desc: 'Company details in the footer and the privacy & cookie notice (opened from the footer and the contact form).', path: 'legal',
    fields: [
      { kind: 'plain', key: 'company', label: 'Company legal name', help: 'e.g. Goosebumps BV. Shown in the footer and the privacy notice.' },
      { kind: 'plain', key: 'address', label: 'Registered office address' },
      { kind: 'plain', key: 'companyNumber', label: 'Enterprise number (KBO/BCE)', help: 'Belgian law requires it on the website, e.g. BE 0123.456.789' },
      { kind: 'plain', key: 'updated', label: 'Privacy notice last updated', help: 'Change this whenever you change the notice.' },
      T('link', 'Link label'), T('formNotice', 'Line under the contact form'), T('title', 'Notice title'),
      {
        kind: 'list', key: 'blocks', label: 'Notice sections', itemName: 'section', title: (b) => en(b.title) || 'New section',
        fields: [T('title', 'Heading'), TL('body', 'Text')],
        make: () => ({ id: newId(), title: emptyL10n(), body: emptyL10n() }),
      },
    ],
  },
  {
    id: 'navCta', name: 'Menu button', desc: 'The highlighted button at the end of the menu.', path: '', countPath: 'navCta',
    fields: [T('navCta', 'Button label')],
  },
];

/** Read obj at a dotted path ('form.email'). */
export function getPath(obj: any, path: string): any {
  return path ? path.split('.').reduce((o, k) => o?.[k], obj) : obj;
}
export function parentOf(obj: any, path: string): [any, string] {
  const parts = path.split('.');
  const last = parts.pop()!;
  return [parts.length ? getPath(obj, parts.join('.')) : obj, last];
}
