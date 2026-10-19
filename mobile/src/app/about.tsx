// About: version, what's new, where your data lives, and the legal terms.
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { Row } from '../components/settings-ui';
import { Card, Icon, IconBtn, Label, Screen, TopBar, Txt, PageTitle } from '../components/ui';
import { AI_NAME } from '../lib/chat-store';
import { useTheme } from '../lib/theme';

// Keep in step with CHANGELOG.md at the project root.
const WHATS_NEW = [
  'Pull down on a recipe to refresh, with a stretchy header',
  'A recipe photo now fills the whole header; blank timers stay blank',
  'A clearer Edit recipe: change the photo, name, ingredients and steps directly',
  'Recipe dish fills the top and fades in behind the buttons; tidier header',
  'Editing a title or amount shows just a line, not a box',
  'A recipe’s dish now fills the top of the page and blends into it',
  'A new Help center with topics and full how-to articles',
  'Attach screenshots and screen recordings when you send feedback',
  'See an example of your units before you choose',
  'Hold and slide along the navigation bar: a glass lens follows your finger',
  'A proper QR scanner, a new Help center and centred page titles',
  'Settings split into their own pages: Cook mode, Units, Hands-free and more',
  'Share recipes, cookbooks, lists and chats with a QR code',
  'A new cooking streak page, and history pages for your kitchen',
  'Mise’s own pop-up sheets replace the plain phone alerts',
  'Sign in and create an account',
  'A new Account page: profile photo, an emoji status and your kitchen at a glance',
  'The meal plan is a real calendar now: tap any day to plan it',
  'The navigation bar floats over the page with a frosted, blurry glass look',
  '“Ready by…”: pick when you want to eat and see when to start each step',
  '“What can I make?”: add what’s in your fridge and see which recipes fit',
  'Collections: sort recipes into Weeknight, Baking or your own',
  'Mise en place: a prep screen to get everything ready before you cook',
  'Switch any recipe between metric and US units, oven temperatures included',
  'Ingredient swaps: tap ⇄ next to an ingredient you don’t have',
  'Reminders for your meal plan, and a nudge to finish a recipe you left halfway',
  `${AI_NAME} can use your meal plan and journal, and you can see exactly what it knows`,
  'Meal planner: plan the week and shop for it in one tap',
  'Cooking journal: rate each cook, add a photo and notes for next time',
  'The tab highlight now glides even when you jump across several tabs',
  'Nutrition scanner: scan a barcode to see the Nutri-Score and what’s inside',
  'Smoother swiping, a sliding tab highlight and sliding switches',
  'Smart shopping list: combines ingredients and sorts them by aisle',
  'A floating navigation bar and a new Sous section in Account',
  'Hands-free cooking: steps read aloud, and voice commands in the Mise app build',
  'Natural phone voices (Premium and Enhanced) and a speed setting',
  'Three plans to choose from: Mise Plus, Pro and Chef',
  'Swipe between tabs like Instagram: the next page slides in right beside the current one',
  'New Account section with Profile, Notifications and Usage',
  `Pick ${AI_NAME}'s voice, and a new Light / Dark / System picker`,
  'The cooks stand right at the counter now',
];

export default function AboutScreen() {
  const th = useTheme();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen>
      <TopBar>
        <IconBtn name="arrow-back" label="Back" onPress={() => router.back()} />
        <PageTitle>About</PageTitle>
      </TopBar>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 48, gap: 18 }}>
        <View style={{ alignItems: 'center', gap: 8, paddingVertical: 12 }}>
          <View style={{ width: 84, height: 84, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: th.c.accent }}>
            <Icon name="restaurant" size={40} color={th.c.onAccent} />
          </View>
          <Txt kind="head" weight="bold" size={28}>Mise</Txt>
          <Txt muted weight="bold">Version {version}</Txt>
          <Txt muted style={{ textAlign: 'center', maxWidth: 300 }}>Paste a recipe and get big, simple steps with timers, made for cooking with messy hands.</Txt>
        </View>

        <View style={{ gap: 8 }}>
          <View style={{ marginLeft: 4 }}><Label color={th.c.muted}>{`What's new in ${version}`}</Label></View>
          <Card style={{ padding: 16, gap: 10 }}>
            {WHATS_NEW.map(line => (
              <View key={line} style={{ flexDirection: 'row', gap: 10 }}>
                <Icon name="sparkles" size={16} color={th.c.accent} />
                <Txt size={15} style={{ flex: 1 }}>{line}</Txt>
              </View>
            ))}
          </Card>
        </View>

        <View style={{ gap: 8 }}>
          <View style={{ marginLeft: 4 }}><Label color={th.c.muted}>Your data</Label></View>
          <Card style={{ padding: 16, gap: 8 }}>
            <Txt size={15}>Your recipes, chats, voice messages and settings are saved on this phone only. There is no account yet.</Txt>
            <Txt size={15}>When you use “Import with AI”, the link, photo or text you choose is sent to Mise’s server, which asks an AI to turn it into steps. Mise doesn’t keep a copy.</Txt>
          </Card>
        </View>

        <Card style={{ paddingHorizontal: 6 }}>
          <Row icon="document-text-outline" title="Terms of Use" onPress={() => router.push('/legal?doc=terms')} />
          <Row icon="shield-checkmark-outline" title="Privacy Policy" onPress={() => router.push('/legal?doc=privacy')} last />
        </Card>
      </ScrollView>
    </Screen>
  );
}
