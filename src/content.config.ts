import { defineCollection, type SchemaContext } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const ingredient = z.object({
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
  item: z.string(),
  note: z.string().optional(),
});

const recipeSchema = ({ image }: SchemaContext) => z.object({
  title: z.string(),
  description: z.string(),
  kind: z.enum(['food', 'cocktail']),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  editorialStatus: z.enum(['draft', 'experimental', 'kitchen-tested']),
  statusNote: z.string().optional(),
  yield: z.object({ amount: z.number().positive(), unit: z.string() }),
  times: z.object({
    prep: z.number().int().nonnegative().optional(),
    cook: z.number().int().nonnegative().optional(),
    total: z.number().int().positive().optional(),
  }),
  equipment: z.array(z.string()).default([]),
  ingredientGroups: z.array(z.object({
    name: z.string(),
    ingredients: z.array(ingredient),
  })).min(1),
  instructionGroups: z.array(z.object({
    name: z.string(),
    steps: z.array(z.string()).min(1),
  })).min(1),
  substitutions: z.array(z.string()).default([]),
  makeAhead: z.array(z.string()).default([]),
  techniqueNotes: z.array(z.string()).default([]),
  pairings: z.array(z.string()).default([]),
  related: z.array(z.string()).default([]),
  relatedCocktails: z.array(z.string()).default([]),
  aiContribution: z.object({
    used: z.boolean(),
    note: z.string().optional(),
    changedAfterCooking: z.string().optional(),
  }).optional(),
  heroImage: image().optional(),
  heroAlt: z.string().optional(),
});

const cocktailIngredient = z.object({
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
  ingredient: z.string(),
  notes: z.string().optional(),
});

const cocktailSchema = ({ image }: SchemaContext) => z.object({
  title: z.string(),
  description: z.string(),
  menuStatus: z.enum(['house', 'rotating', 'experimental', 'archived']),
  testingStatus: z.enum(['tested', 'provisional', 'proposed']),
  season: z.array(z.enum(['spring', 'summer', 'autumn', 'winter'])).default([]),
  baseSpirit: z.string(),
  styles: z.array(z.string()).min(1),
  flavorProfiles: z.array(z.string()).min(1),
  servings: z.number().int().positive().default(1),
  glassware: z.string().optional(),
  ingredients: z.array(cocktailIngredient).default([]),
  garnish: z.array(z.string()).default([]),
  pairedRecipes: z.array(z.string()).default([]),
  dateCreated: z.coerce.date().optional(),
  heroImage: image().optional(),
  heroAlt: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.testingStatus === 'tested' && data.ingredients.length === 0) {
    ctx.addIssue({ code: 'custom', path: ['ingredients'], message: 'Tested cocktails require a complete ingredient list.' });
  }
  if (data.testingStatus === 'tested' && !data.glassware) {
    ctx.addIssue({ code: 'custom', path: ['glassware'], message: 'Tested cocktails require glassware.' });
  }
  if (['house', 'rotating'].includes(data.menuStatus) && data.testingStatus !== 'tested') {
    ctx.addIssue({ code: 'custom', path: ['testingStatus'], message: 'Curated menu cocktails must be tested.' });
  }
  if (data.heroImage && !data.heroAlt) {
    ctx.addIssue({ code: 'custom', path: ['heroAlt'], message: 'Cocktail images require factual alt text.' });
  }
});

const menuSchema = z.object({
  title: z.string(),
  description: z.string(),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  editorialStatus: z.enum(['draft', 'experimental', 'kitchen-tested']),
  servings: z.number().int().positive(),
  recipes: z.array(z.object({ slug: z.string(), course: z.string() })).min(1),
  timeline: z.array(z.object({ offset: z.string(), task: z.string() })).min(1),
  tags: z.array(z.string()).default([]),
});

const noteSchema = z.object({
  title: z.string(),
  description: z.string(),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  editorialStatus: z.enum(['draft', 'experimental', 'kitchen-tested']),
  topic: z.enum(['technique', 'cuisine', 'experiment', 'lesson']),
  tags: z.array(z.string()).default([]),
  relatedRecipes: z.array(z.string()).default([]),
});

export const collections = {
  cocktails: defineCollection({ loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/cocktails' }), schema: cocktailSchema }),
  recipes: defineCollection({ loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/recipes' }), schema: recipeSchema }),
  menus: defineCollection({ loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/menus' }), schema: menuSchema }),
  notes: defineCollection({ loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes' }), schema: noteSchema }),
  fixtureRecipes: defineCollection({ loader: glob({ pattern: '**/*.{md,mdx}', base: './src/fixtures/recipes' }), schema: recipeSchema }),
  fixtureMenus: defineCollection({ loader: glob({ pattern: '**/*.{md,mdx}', base: './src/fixtures/menus' }), schema: menuSchema }),
  fixtureNotes: defineCollection({ loader: glob({ pattern: '**/*.{md,mdx}', base: './src/fixtures/notes' }), schema: noteSchema }),
};
