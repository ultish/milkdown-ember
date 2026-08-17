export declare const mentionSchema: import("@milkdown/kit/utils").$NodeSchema<"mention">;
export interface InsertMentionPayload {
    id: string;
    label: string;
    range?: {
        from: number;
        to: number;
    };
}
export declare const insertMentionCommand: import("@milkdown/kit/utils").$Command<InsertMentionPayload>;
//# sourceMappingURL=schema.d.ts.map