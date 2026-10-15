// Terms of Use and Privacy Policy (?doc=terms | ?doc=privacy), in plain language.
// NOTE: these are drafts written to match what the app does today. Have them reviewed (and add the
// publisher's legal name and contact address) before publishing to the App Store or Play Store.
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { IconBtn, Screen, TopBar, Txt } from '../components/ui';
import { AI_NAME } from '../lib/chat-store';
import { useTheme } from '../lib/theme';

const UPDATED = '15 October 2026';

type Doc = { title: string; intro: string; sections: { h: string; p: string[] }[] };

const TERMS: Doc = {
  title: 'Terms of Use',
  intro: 'By using Mise you agree to these terms. If you don’t agree, please don’t use the app.',
  sections: [
    { h: 'What Mise does', p: ['Mise turns recipes you add into step-by-step cooking guides with timers. It also includes optional AI features, such as Import with AI and the Sous assistant (currently a preview).'] },
    { h: 'Cook safely', p: [
      'Recipes, steps, times and temperatures shown in Mise, including anything made by AI, may contain mistakes. Always use your own judgement in the kitchen.',
      'Check that food is cooked through, follow food-safety guidance, and double-check ingredients for allergies and dietary needs. Mise is not a substitute for professional, medical or nutritional advice.',
    ] },
    { h: 'AI features', p: ['AI-generated content can be wrong, incomplete or unexpected. Review it before you rely on it. Don’t use the AI features to create anything unlawful or harmful, or to try to break or overload the service.'] },
    { h: 'Your content', p: ['Recipes, notes, chats and recordings you add stay yours. You’re responsible for having the right to use any recipe, photo or link you add. Mise doesn’t claim ownership of your content.'] },
    { h: 'Timers and alarms', p: ['Mise tries hard to ring on time, but alarms depend on your phone’s settings (notifications, Focus, volume, battery saving). Don’t rely on Mise alone where a missed timer could be dangerous.'] },
    { h: 'No warranty', p: ['Mise is provided “as is”, without warranties of any kind. To the extent the law allows, we aren’t liable for indirect or consequential losses, or for loss of data, arising from your use of the app. Nothing here limits rights you have under consumer law.'] },
    { h: 'Changes', p: ['We may update the app and these terms. If the changes are important, we’ll let you know in the app. Continuing to use Mise after an update means you accept the new terms.'] },
    { h: 'Contact', p: ['Questions about these terms? Use Report an issue or Send feedback on the Account tab.'] },
  ],
};

const PRIVACY: Doc = {
  title: 'Privacy Policy',
  intro: 'Mise is built to keep your kitchen to yourself. Here is exactly what happens with your information.',
  sections: [
    { h: 'Saved on your phone', p: [`Your recipes, settings, timers, chats with ${AI_NAME}, voice messages and photos you attach are stored on this phone only. There is no account yet, and we can’t see this information.`, 'Deleting the app deletes this information.'] },
    { h: 'Import with AI', p: [
      'When you choose Import with AI, the link, photo or text you pick is sent securely to Mise’s server, which asks an AI provider (Anthropic’s Claude) to turn it into a recipe. The result comes straight back to your phone.',
      'Mise doesn’t keep a copy of what you send. The AI provider processes it under its own terms and privacy commitments.',
      'To stop abuse, the server briefly uses a random ID created by the app and your IP address to count requests. These counters are not linked to your name or content, and are deleted automatically within a day.',
    ] },
    { h: 'Nutrition scanner', p: ['When you scan or type a barcode, only that number is sent to Open Food Facts, a free public food database, to look up the product. Your recent scans are kept on this phone.'] },
    { h: `${AI_NAME} (preview)`, p: [`${AI_NAME} isn’t connected to an AI yet, so nothing you type or record in a chat leaves your phone. We’ll update this policy before that changes.`] },
    { h: 'Microphone, camera and photos', p: ['Mise asks for these only when you use a feature that needs them (voice messages, voice mode, photo import or attachments). You can change access at any time in your phone’s Settings.'] },
    { h: 'Notifications', p: ['Timer alerts are scheduled on your phone. They are not sent through our servers.'] },
    { h: 'Feedback and reports', p: ['If you send feedback or an issue report, it goes through your own email or sharing app, so we receive what you send plus your email address (if you use email), the app version and your phone type. We use it only to reply and improve Mise.'] },
    { h: 'What we don’t do', p: ['No ads, no tracking across apps, no analytics SDKs, and we never sell your information.'] },
    { h: 'Children', p: ['Mise isn’t directed at children under 13, and we don’t knowingly collect their information.'] },
    { h: 'Changes and contact', p: ['If this policy changes, we’ll update the date below and tell you in the app for important changes. Questions? Use Report an issue or Send feedback on the Account tab.'] },
  ],
};

export default function LegalScreen() {
  const th = useTheme();
  const doc = useLocalSearchParams<{ doc?: string }>().doc === 'privacy' ? PRIVACY : TERMS;
  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <Txt kind="head" weight="bold" size={19} style={{ flex: 1, paddingLeft: 4 }}>{doc.title}</Txt>
      </TopBar>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 48, gap: 18 }}>
        <Txt muted size={13} weight="bold">Last updated {UPDATED}</Txt>
        <Txt size={16} style={{ lineHeight: 24 }}>{doc.intro}</Txt>
        {doc.sections.map(s => (
          <View key={s.h} style={{ gap: 8 }}>
            <Txt kind="head" weight="bold" size={19}>{s.h}</Txt>
            {s.p.map(p => <Txt key={p} size={15} color={th.c.text} style={{ lineHeight: 23 }}>{p}</Txt>)}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
