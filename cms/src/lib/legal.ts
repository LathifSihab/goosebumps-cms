/* Default privacy & cookie notice, used for sites saved before Site.legal existed.
   Texts may use {company} and {email}; render.ts fills them in from the legal and contact details. */

import { newId, type L10n, type Site } from './schema.ts';

export type Legal = Site['legal'];

const block = (title: L10n, body: L10n) => ({ id: newId(), title, body });

export function defaultLegal(): Legal {
  return {
    company: '',
    address: '',
    companyNumber: '',
    updated: '2026-10-15',
    link: { en: 'Privacy & cookies', fr: 'Confidentialité & cookies', nl: 'Privacy & cookies' },
    formNotice: {
      en: 'We use your details only to reply to your enquiry.',
      fr: 'Nous utilisons vos coordonnées uniquement pour répondre à votre demande.',
      nl: 'We gebruiken uw gegevens alleen om uw aanvraag te beantwoorden.',
    },
    title: { en: 'Privacy & cookies', fr: 'Confidentialité & cookies', nl: 'Privacy & cookies' },
    blocks: [
      block(
        { en: 'Who is responsible?', fr: 'Qui est responsable ?', nl: 'Wie is verantwoordelijk?' },
        {
          en: '{company} is responsible for the personal data processed through this website. You can reach us at {email}.',
          fr: '{company} est responsable des données personnelles traitées via ce site. Vous pouvez nous joindre à {email}.',
          nl: '{company} is verantwoordelijk voor de persoonsgegevens die via deze website worden verwerkt. U bereikt ons via {email}.',
        },
      ),
      block(
        { en: 'What we collect and why', fr: 'Ce que nous collectons et pourquoi', nl: 'Wat we verzamelen en waarom' },
        {
          en: 'When you send the enquiry form, or email or call us, we receive your name, email address, phone number (if you give it) and the details of your event. We use them only to answer your enquiry and, if you wish, to prepare a quote and organise your event. The legal basis is taking steps at your request before entering into a contract (Art. 6(1)(b) GDPR). We do not use your details for marketing and never sell them.',
          fr: "Lorsque vous envoyez le formulaire de demande, ou que vous nous écrivez ou nous appelez, nous recevons votre nom, votre adresse e-mail, votre numéro de téléphone (si vous le donnez) et les détails de votre événement. Nous les utilisons uniquement pour répondre à votre demande et, si vous le souhaitez, pour établir une offre et organiser votre événement. La base légale est l'exécution de mesures précontractuelles prises à votre demande (art. 6.1.b du RGPD). Nous n'utilisons pas vos données à des fins de marketing et ne les vendons jamais.",
          nl: 'Wanneer u het aanvraagformulier verstuurt, ons mailt of belt, ontvangen we uw naam, e-mailadres, telefoonnummer (als u het opgeeft) en de details van uw evenement. We gebruiken die alleen om uw aanvraag te beantwoorden en, als u dat wenst, om een offerte op te maken en uw evenement te organiseren. De rechtsgrond is het nemen van precontractuele maatregelen op uw verzoek (art. 6.1.b AVG). We gebruiken uw gegevens niet voor marketing en verkopen ze nooit.',
        },
      ),
      block(
        { en: 'Who receives your data', fr: 'Qui reçoit vos données', nl: 'Wie uw gegevens ontvangt' },
        {
          en: 'The enquiry form is delivered to our inbox by FormSubmit (formsubmit.co), a form-forwarding service. This website is hosted by Cloudflare, which processes technical data such as your IP address to deliver the site and protect it against abuse. These providers may process data outside the European Union.',
          fr: "Le formulaire de demande est transmis à notre boîte mail par FormSubmit (formsubmit.co), un service de transfert de formulaires. Ce site est hébergé par Cloudflare, qui traite des données techniques comme votre adresse IP pour afficher le site et le protéger contre les abus. Ces prestataires peuvent traiter des données en dehors de l'Union européenne.",
          nl: 'Het aanvraagformulier wordt naar onze mailbox doorgestuurd door FormSubmit (formsubmit.co), een dienst voor het doorsturen van formulieren. Deze website wordt gehost door Cloudflare, dat technische gegevens zoals uw IP-adres verwerkt om de site te tonen en te beveiligen tegen misbruik. Deze dienstverleners kunnen gegevens buiten de Europese Unie verwerken.',
        },
      ),
      block(
        { en: 'How long we keep it', fr: 'Durée de conservation', nl: 'Hoe lang we uw gegevens bewaren' },
        {
          en: 'We keep enquiries for as long as we need them to handle your request, and at most 2 years after our last contact. If you become a client, we keep what Belgian accounting and tax law requires.',
          fr: 'Nous conservons les demandes aussi longtemps que nécessaire pour les traiter, et au maximum 2 ans après notre dernier contact. Si vous devenez client, nous conservons ce que la législation comptable et fiscale belge exige.',
          nl: 'We bewaren aanvragen zo lang als nodig om ze te behandelen, en maximaal 2 jaar na ons laatste contact. Wordt u klant, dan bewaren we wat de Belgische boekhoud- en belastingwetgeving vereist.',
        },
      ),
      block(
        { en: 'Cookies', fr: 'Cookies', nl: 'Cookies' },
        {
          en: 'This website does not use cookies for analytics, advertising or tracking, and has no third-party trackers. The fonts are served from our own server and your language choice is not stored. The only cookie is set in the private editing area (/admin) for the people who maintain the site; it is strictly necessary to protect it.',
          fr: "Ce site n'utilise pas de cookies d'analyse, de publicité ou de suivi, ni de traceurs de tiers. Les polices de caractères sont servies depuis notre propre serveur et votre choix de langue n'est pas enregistré. Le seul cookie est placé dans l'espace d'édition privé (/admin), pour les personnes qui gèrent le site ; il est strictement nécessaire pour le protéger.",
          nl: 'Deze website gebruikt geen cookies voor analyse, advertenties of tracking, en geen trackers van derden. De lettertypes komen van onze eigen server en uw taalkeuze wordt niet opgeslagen. De enige cookie wordt geplaatst in de afgeschermde beheeromgeving (/admin) voor wie de site beheert; die is strikt noodzakelijk om ze te beveiligen.',
        },
      ),
      block(
        { en: 'Your rights', fr: 'Vos droits', nl: 'Uw rechten' },
        {
          en: 'You can ask us at any time to see, correct or delete your personal data, to restrict or object to its use, or to receive it in a portable format. Just email {email}. If you think we are not handling your data correctly, you can lodge a complaint with the Belgian Data Protection Authority (www.dataprotectionauthority.be).',
          fr: "Vous pouvez à tout moment nous demander d'accéder à vos données personnelles, de les rectifier ou de les supprimer, d'en limiter l'utilisation ou de vous y opposer, ou de les recevoir dans un format portable. Il suffit d'écrire à {email}. Si vous estimez que nous ne traitons pas vos données correctement, vous pouvez introduire une plainte auprès de l'Autorité de protection des données (www.autoriteprotectiondonnees.be).",
          nl: 'U kunt ons altijd vragen om uw persoonsgegevens in te zien, te verbeteren of te wissen, het gebruik ervan te beperken of er bezwaar tegen te maken, of ze in een overdraagbaar formaat te ontvangen. Mail ons gewoon via {email}. Vindt u dat we uw gegevens niet correct behandelen, dan kunt u een klacht indienen bij de Gegevensbeschermingsautoriteit (www.gegevensbeschermingsautoriteit.be).',
        },
      ),
    ],
  };
}

/** Fills in parts of the content model added after a site.json (or a stored draft) was saved. */
export function withDefaults(site: Site): Site {
  site.legal ??= defaultLegal();
  return site;
}
