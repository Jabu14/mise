// Common ingredient swaps for when you're missing something. Kept to tried-and-true kitchen
// substitutes; for anything else, "Ask Sous" opens the chat with the question ready.
type Swap = { match: RegExp; name: string; options: string[] };

const SWAPS: Swap[] = [
  { match: /buttermilk/i, name: 'Buttermilk', options: ['Milk + 1 tbsp lemon juice or white vinegar per cup (240 ml); let it sit 5 minutes', 'Plain yogurt thinned with a little milk'] },
  { match: /sour cream/i, name: 'Sour cream', options: ['Greek yogurt, same amount', 'Crème fraîche, same amount'] },
  { match: /cr[eè]me fra[iî]che/i, name: 'Crème fraîche', options: ['Sour cream, same amount', 'Greek yogurt (don’t boil it, it can split)'] },
  { match: /heavy cream|double cream|whipping cream/i, name: 'Heavy cream', options: ['For sauces: ¾ milk + ¼ melted butter', 'Full-fat coconut cream (won’t whip the same)'] },
  { match: /greek yog(h)?urt/i, name: 'Greek yogurt', options: ['Plain yogurt, strained for 30 minutes', 'Sour cream, same amount'] },
  { match: /\bmilk\b(?!.*(coconut|condensed|evaporated|butter))/i, name: 'Milk', options: ['Any plant milk (oat and soy behave most like dairy)', 'Half water, half plain yogurt or cream'] },
  { match: /\bbutter\b(?!milk)/i, name: 'Butter', options: ['For baking: the same weight of margarine', 'For cooking: olive oil (use about ¾ of the amount)', 'In cakes: neutral oil, about ¾ of the amount (a little denser)'] },
  { match: /\beggs?\b(?! ?(white|yolk))/i, name: 'Egg', options: ['1 tbsp ground flaxseed + 3 tbsp water, rested 5 minutes (per egg)', '¼ cup (60 g) unsweetened applesauce or mashed banana (in sweet bakes)', '3 tbsp aquafaba (the liquid from a can of chickpeas)'] },
  { match: /brown sugar/i, name: 'Brown sugar', options: ['White sugar + 1 tbsp molasses per cup (200 g)', 'White sugar on its own (a little less chewy)'] },
  { match: /\bhoney\b/i, name: 'Honey', options: ['Maple syrup, same amount', 'Golden syrup or agave, same amount'] },
  { match: /maple syrup/i, name: 'Maple syrup', options: ['Honey, same amount', 'Brown sugar dissolved in a splash of water'] },
  { match: /baking powder/i, name: 'Baking powder', options: ['Per 1 tsp: ¼ tsp baking soda + ½ tsp cream of tartar', 'Per 1 tsp: ¼ tsp baking soda + ½ cup buttermilk or yogurt (cut other liquid)'] },
  { match: /baking soda|bicarbonate|bicarb/i, name: 'Baking soda', options: ['3× the amount of baking powder (taste may change slightly)'] },
  { match: /self[- ]rais(ing|e)|self[- ]rising/i, name: 'Self-raising flour', options: ['Per 1 cup (125 g) plain flour: add 1½ tsp baking powder + ¼ tsp salt'] },
  { match: /bread flour|strong (white )?flour/i, name: 'Bread flour', options: ['Plain (all-purpose) flour: a slightly softer, less chewy crumb'] },
  { match: /corn ?starch|cornflour/i, name: 'Cornstarch', options: ['Plain flour, twice the amount (cook a little longer)', 'Potato starch or arrowroot, same amount'] },
  { match: /instant yeast|fast[- ]action/i, name: 'Instant yeast', options: ['Active dry yeast, 25% more; dissolve it in the warm liquid first', 'Fresh yeast, 3× the weight'] },
  { match: /active dry yeast|dried yeast/i, name: 'Active dry yeast', options: ['Instant yeast, 25% less; mix straight into the flour'] },
  { match: /lemon juice/i, name: 'Lemon juice', options: ['Lime juice, same amount', 'White wine vinegar, half the amount'] },
  { match: /lime juice/i, name: 'Lime juice', options: ['Lemon juice, same amount'] },
  { match: /white wine(?! vinegar)/i, name: 'White wine', options: ['Chicken or vegetable stock + a squeeze of lemon', 'Dry vermouth, same amount'] },
  { match: /red wine(?! vinegar)/i, name: 'Red wine', options: ['Beef stock + 1 tsp red wine vinegar or balsamic per cup'] },
  { match: /wine vinegar|cider vinegar/i, name: 'Vinegar', options: ['Any mild vinegar, same amount', 'Lemon juice, same amount'] },
  { match: /soy sauce|tamari/i, name: 'Soy sauce', options: ['Tamari (gluten-free), same amount', 'Coconut aminos (sweeter, less salty)'] },
  { match: /\bgarlic\b/i, name: 'Garlic', options: ['⅛ tsp garlic powder per clove', '½ tsp jarred minced garlic per clove'] },
  { match: /\bshallots?\b/i, name: 'Shallot', options: ['Red or white onion, about half the amount', 'The white part of spring onions'] },
  { match: /\bonions?\b/i, name: 'Onion', options: ['1 tbsp onion powder per medium onion', 'Shallots or leeks'] },
  { match: /fresh (herbs|parsley|basil|coriander|cilantro|thyme|rosemary|oregano|dill|mint)/i, name: 'Fresh herbs', options: ['Dried herbs, a third of the amount (add them earlier)'] },
  { match: /breadcrumbs|panko/i, name: 'Breadcrumbs', options: ['Crushed crackers or cornflakes', 'Rolled oats, pulsed', 'Ground almonds (gluten-free)'] },
  { match: /mayonnaise|\bmayo\b/i, name: 'Mayonnaise', options: ['Greek yogurt (lighter, tangier)', 'Mashed avocado in sandwiches'] },
  { match: /parmesan|parmigiano/i, name: 'Parmesan', options: ['Pecorino or Grana Padano', 'Nutritional yeast (dairy-free)'] },
  { match: /chicken (stock|broth)|vegetable (stock|broth)|beef (stock|broth)|\bstock\b|\bbroth\b/i, name: 'Stock', options: ['A stock cube or 1 tsp bouillon paste per 2 cups (500 ml) water', 'Water + a splash of soy sauce for depth'] },
  { match: /tomato paste|tomato pur[eé]e/i, name: 'Tomato paste', options: ['3× the amount of passata or tomato sauce, cooked down', 'Ketchup, same amount (sweeter)'] },
  { match: /dark chocolate|semi-?sweet chocolate|chocolate chips/i, name: 'Chocolate', options: ['3 tbsp cocoa + 1 tbsp butter + 1 tbsp sugar per 30 g (1 oz)'] },
  { match: /vanilla (extract|essence)/i, name: 'Vanilla extract', options: ['Maple syrup, same amount', 'Vanilla bean paste, same amount', 'Leave it out: the bake will still work'] },
  { match: /\brice vinegar\b/i, name: 'Rice vinegar', options: ['Apple cider vinegar + a pinch of sugar'] },
  { match: /\bsugar\b/i, name: 'Sugar', options: ['Caster or granulated work the same', 'Honey or maple syrup: ¾ of the amount and cut the liquid a little'] },
];

// Swaps for one ingredient line, or null if we don't know any.
export function swapsFor(line: string): { name: string; options: string[] } | null {
  const text = line.replace(/\*\*/g, '');
  const swap = SWAPS.find(s => s.match.test(text));
  return swap ? { name: swap.name, options: swap.options } : null;
}
