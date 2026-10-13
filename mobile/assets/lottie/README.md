# Step animations (Lottie)

Every cooking step in Mise shows one **action**. The app picks the action from the step's words
(for example "stir the yeast…" → `mix`, "bake for 40 minutes" → `bake`). So you only need **one
animation per action**, and every recipe, including new ones, automatically uses the same
characters.

If an action has no file here yet, the app shows its own drawn cook instead.

## 1. Name the files after the action

| File | When it plays |
|---|---|
| `mix.json` | stir, mix, combine, toss, blend |
| `knead.json` | knead, shape, fold, roll out, stretch |
| `rise.json` | rise, rest, prove, wait, leave for…, marinate, soak |
| `bake.json` | oven, bake, roast, preheat |
| `boil.json` | boil, simmer, pot, saucepan |
| `chop.json` | chop, slice, dice, cut, mince, peel, grate |
| `fry.json` | fry, sauté, sear, brown, pan, toast |
| `whisk.json` | whisk, beat, whip |
| `pour.json` | pour, add, drizzle, transfer |
| `season.json` | season, salt, pepper, sprinkle |
| `cool.json` | cool, chill, set aside |
| `serve.json` | serve, plate, garnish, enjoy |
| `hello.json` | anything else |

Want more than one cook? Add versions: `mix-2.json`, `mix-3.json`… They take turns from step
to step.

## 2. Export settings

- Format: **Lottie JSON** (`.json`). `.lottie` works too.
- Size: landscape **480 × 340** (same shape as the picture box), transparent background.
- Length: a **seamless 2–3 second loop**, 30 fps.
- Keep each file small, ideally under 200 KB. Avoid embedded images; vectors only.

## 3. Add them to the app

1. Put the files in this folder (`mobile/assets/lottie/`).
2. Run `npm run sync-lottie` in the `mobile` folder (or ask Claude to).
3. Reload the app.

## 4. Prompts for the LottieFiles AI

Consistency is the hard part with AI generators. To keep every animation looking like the same
world, **paste the style block and the same character block every time**, then add one action
line. Create a character once, save it, and reuse it for every action when the tool allows.

### Style block (paste first, every time)

> Flat 2D vector cartoon in a friendly, playful style like modern learning apps. No outlines.
> Bold solid colours with one soft darker shade per shape. Big round head, small rounded body,
> long soft "noodle" arms with round hands, short legs, rounded shoes. Large white eyes with dark
> pupils and a tiny highlight, rosy cheeks, expressive open-mouth smile. Transparent background.
> Landscape 480×340. The character stands in the left half, facing right, feet near the bottom.
> On the right half, a light wooden kitchen counter whose top is at two-thirds of the height,
> close enough that the character's hands rest on it naturally. Smooth, bouncy, seamless 2-second
> loop at 30 fps.

### Character blocks (pick one, use the exact same words each time)

- **Mia:** warm light-brown skin, dark brown hair in a high bun with an orange hair tie, orange
  long-sleeve top, white apron, navy trousers, coral shoes.
- **Sam:** deep brown skin, black curly hair with a yellow headband, teal long-sleeve top, white
  apron, purple trousers, yellow shoes.
- **Noor:** light skin, pink hijab, purple long-sleeve top, white apron, pink trousers, navy shoes.

### Action lines (one per file)

- **mix:** stirring a blue mixing bowl on the counter with a wooden spoon in a small circular
  motion, a few flour puffs rising.
- **knead:** pressing and folding a soft ball of dough on the counter with both hands; the dough
  squashes and springs back.
- **rise:** waiting next to a blue bowl of dough that slowly puffs up; the character sways gently,
  eyes closed, with small "z z" floating up.
- **bake:** standing beside a silver oven with a glowing orange window and a loaf inside, pointing
  at it happily while wearing a red oven mitt; warm heat waves rise.
- **boil:** lifting the lid of a red pot on the counter; water bubbles and steam puffs out.
- **chop:** chopping a carrot on a wooden board with a chef's knife in a quick up-and-down
  rhythm; carrot slices hop.
- **fry:** holding a frying pan over a small flame and gently tossing; an egg and veggie cubes
  flip in the air.
- **whisk:** holding a small blue bowl against the body with one arm and whisking fast with the
  other; little froth bubbles appear.
- **pour:** tilting a clear jug of water to pour a smooth stream into a blue bowl on the counter.
- **season:** shaking a salt shaker over a bowl of sauce; tiny grains fall.
- **cool:** fanning a freshly baked loaf on a cooling rack with a small red hand fan; soft breeze
  lines.
- **serve:** proudly holding up a plate with a steaming dish and a green herb leaf, bouncing
  happily; golden sparkles twinkle.
- **hello:** standing and waving with one hand, the other on the hip, a few sparkles around.

### Example (Mia stirring)

> [Style block] Character: Mia: warm light-brown skin, dark brown hair in a high bun with an
> orange hair tie, orange long-sleeve top, white apron, navy trousers, coral shoes. Action:
> stirring a blue mixing bowl on the counter with a wooden spoon in a small circular motion, a few
> flour puffs rising.

Save it as `mix.json` (Mia), then `mix-2.json` (Sam), `mix-3.json` (Noor), and so on.
