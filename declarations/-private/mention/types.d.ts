export interface MentionCandidate {
    id: string;
    label: string;
}
export type MentionSearch = (query: string) => MentionCandidate[] | Promise<MentionCandidate[]>;
export interface MentionConfig {
    onSearch: MentionSearch;
    trigger?: string;
}
//# sourceMappingURL=types.d.ts.map