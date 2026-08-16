import type { TOC } from '@ember/component/template-only';

export interface CookbookSectionSignature {
  Element: HTMLElement;
  Args: {
    id: string;
    title: string;
    blurb?: string;
    code: string;
  };
  Blocks: {
    default: [];
  };
}

/// One cookbook recipe: a heading, an optional live example, and a
/// collapsible snippet. The live panel is gated on `has-block` because
/// most recipes on this page are prose-only — a Crepe editor is a full
/// ProseMirror instance with lazy CodeMirror and KaTeX behind it, so the
/// page mounts three of them rather than one per section.
const CookbookSection: TOC<CookbookSectionSignature> = <template>
  <section
    id={{@id}}
    class="scroll-mt-24 space-y-3 border-b border-slate-200 pb-10 last:border-b-0"
    ...attributes
  >
    <header class="space-y-1">
      <h2 class="text-xl font-semibold tracking-tight">{{@title}}</h2>
      {{#if @blurb}}
        <p class="text-sm leading-relaxed opacity-70">{{@blurb}}</p>
      {{/if}}
    </header>

    {{#if (has-block)}}
      <div class="space-y-3 rounded border border-slate-200 bg-white p-4">
        <p class="text-xs font-medium tracking-wide uppercase opacity-50">
          Live
        </p>
        {{yield}}
      </div>
    {{/if}}

    <details class="rounded border border-slate-200 bg-slate-50" open>
      <summary
        class="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-2.5 text-sm font-medium"
      >
        <span>How to build this</span>
      </summary>
      <pre
        class="m-0 overflow-x-auto border-t border-slate-200 bg-slate-100 px-4 py-3 font-mono text-xs leading-relaxed"
      ><code>{{@code}}</code></pre>
    </details>
  </section>
</template>;

export default CookbookSection;
