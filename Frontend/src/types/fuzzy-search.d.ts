declare module 'fuzzy-search' {
    export default class FuzzySearch<T> {
        constructor(haystack: T[], keys?: string[], options?: { caseSensitive?: boolean; sort?: boolean });
        search(needle: string): T[];
    }
}
