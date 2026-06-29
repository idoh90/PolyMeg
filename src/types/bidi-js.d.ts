declare module "bidi-js" {
  interface EmbeddingLevels {
    levels: Uint8Array;
    paragraphs: { start: number; end: number; level: number }[];
  }
  interface Bidi {
    getEmbeddingLevels(text: string, explicitDirection?: "ltr" | "rtl" | "auto"): EmbeddingLevels;
    getReorderedString(text: string, embeddingLevels: EmbeddingLevels): string;
    getReorderSegments(text: string, embeddingLevels: EmbeddingLevels): [number, number][];
    getReorderedIndices(text: string, embeddingLevels: EmbeddingLevels): number[];
  }
  export default function bidiFactory(): Bidi;
}
