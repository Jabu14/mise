// Mise's public website links, opened in the browser from the app. Update MISE_WEB if the site
// moves to a custom domain.
import { Linking } from 'react-native';

export const MISE_WEB = 'https://jabu14.github.io/mise';
export const HELP_URL = `${MISE_WEB}/help/`;
export const CONTACT_URL = `${MISE_WEB}/help/contact.html`;
export const LEGAL_URL = `${MISE_WEB}/help/legal.html`;

export const openUrl = (url: string) => Linking.openURL(url).catch(() => {});
