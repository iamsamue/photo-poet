// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview Generates a poem based on extracted themes and emotions from a photo, in a specified style.
 *
 * - generatePoemFromThemes - A function that generates a poem from themes.
 * - GeneratePoemFromThemesInput - The input type for the generatePoemFromThemes function.
 * - GeneratePoemFromThemesOutput - The return type for the generatePoemFromThemes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePoemFromThemesInputSchema = z.object({
  themes: z.string().describe('The themes extracted from the photo.'),
  emotions: z.string().describe('The emotions extracted from the photo.'),
  style: z.string().optional().describe('The style of the poem to generate (e.g., Haiku, Limerick, Sonnet).'),
});
export type GeneratePoemFromThemesInput = z.infer<typeof GeneratePoemFromThemesInputSchema>;

const GeneratePoemFromThemesOutputSchema = z.object({
  poem: z.string().describe('The generated poem.'),
});
export type GeneratePoemFromThemesOutput = z.infer<typeof GeneratePoemFromThemesOutputSchema>;

export async function generatePoemFromThemes(input: GeneratePoemFromThemesInput): Promise<GeneratePoemFromThemesOutput> {
  return generatePoemFromThemesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePoemFromThemesPrompt',
  input: {schema: GeneratePoemFromThemesInputSchema},
  output: {schema: GeneratePoemFromThemesOutputSchema},
  prompt: `You are a skilled poet. You will generate a poem based on the themes and emotions extracted from a photo.

Themes: {{{themes}}}
Emotions: {{{emotions}}}

{{#if style}}Poem Style: {{{style}}}{{/if}}

Generate a poem that reflects the image's mood.
`,
});

const generatePoemFromThemesFlow = ai.defineFlow(
  {
    name: 'generatePoemFromThemesFlow',
    inputSchema: GeneratePoemFromThemesInputSchema,
    outputSchema: GeneratePoemFromThemesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
