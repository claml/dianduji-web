/**
 * Specialized scientific dictionary (5 domains, 1065 terms).
 *
 * Data: public/specialized.json copied from the mobile repo's
 * assets/specialized/terms.json (MIT, self-curated). Terms include
 * multi-word phrases; lookups try the longest match around the tapped
 * token by joining neighbouring tokens.
 */

export const DOMAIN_LABELS: Record<string, string> = {
  computerScience: '计算机',
  medicine: '医学',
  biology: '生物',
  chemistry: '化学',
  gis: '地理信息',
};

export interface SpecializedTerm {
  term: string;
  domain: string;
  definition: string;
  synonyms?: string[];
}

interface TermsFile {
  terms: Array<{
    term: string;
    domain: string;
    definition: string;
    synonyms?: string[];
  }>;
}

export class SpecializedDictionary {
  private terms = new Map<string, SpecializedTerm>();
  private loaded: Promise<void> | null = null;

  constructor(private readonly url = 'specialized.json') {}

  private ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      this.loaded = (async () => {
        const response = await fetch(this.url);
        if (!response.ok) throw new Error(`specialized dict unavailable (${response.status})`);
        const file = (await response.json()) as TermsFile;
        for (const entry of file.terms) {
          this.terms.set(entry.term.toLowerCase(), {
            term: entry.term,
            domain: entry.domain,
            definition: entry.definition,
            synonyms: entry.synonyms,
          });
        }
      })();
    }
    return this.loaded;
  }

  /**
   * Resolves a multi-word term around the tapped token. `tokens` is the
   * ordered token list of the page, `index` the tapped one; windows of
   * up to maxWords words containing the index are tried longest-first.
   */
  async lookupAround(
    tokens: string[],
    index: number,
    maxWords = 4,
  ): Promise<SpecializedTerm | null> {
    await this.ensureLoaded();
    const size = Math.min(tokens.length, maxWords);
    for (let width = size; width >= 1; width--) {
      const minStart = Math.max(0, index - width + 1);
      const maxStart = Math.min(index, tokens.length - width);
      for (let start = minStart; start <= maxStart; start++) {
        const phrase = tokens.slice(start, start + width).join(' ').toLowerCase();
        const hit = this.terms.get(phrase);
        if (hit) return hit;
      }
    }
    return null;
  }
}
