import { getCollection, type CollectionEntry } from 'astro:content';

export const showFixtures = import.meta.env.SHOW_FIXTURES === 'true';

export type RecipeEntry = CollectionEntry<'recipes'> | CollectionEntry<'fixtureRecipes'>;
export type MenuEntry = CollectionEntry<'menus'> | CollectionEntry<'fixtureMenus'>;
export type NoteEntry = CollectionEntry<'notes'> | CollectionEntry<'fixtureNotes'>;

export async function getRecipes(): Promise<RecipeEntry[]> {
  const real = await getCollection('recipes', ({ data }) => showFixtures || data.editorialStatus !== 'draft');
  const fixtures = showFixtures ? await getCollection('fixtureRecipes') : [];
  return [...real, ...fixtures].sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());
}

export async function getMenus(): Promise<MenuEntry[]> {
  const real = await getCollection('menus', ({ data }) => showFixtures || data.editorialStatus !== 'draft');
  const fixtures = showFixtures ? await getCollection('fixtureMenus') : [];
  return [...real, ...fixtures].sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());
}

export async function getNotes(): Promise<NoteEntry[]> {
  const real = await getCollection('notes', ({ data }) => showFixtures || data.editorialStatus !== 'draft');
  const fixtures = showFixtures ? await getCollection('fixtureNotes') : [];
  return [...real, ...fixtures].sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());
}

export function isFixture(entry: RecipeEntry | MenuEntry | NoteEntry) {
  return entry.collection.startsWith('fixture');
}

export function slugFor(entry: RecipeEntry | MenuEntry | NoteEntry) {
  return entry.id.replace(/\.(md|mdx)$/, '').replace(/\/index$/, '');
}

export function minutesToIso(minutes?: number) {
  return minutes ? `PT${minutes}M` : undefined;
}
