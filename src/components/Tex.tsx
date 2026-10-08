import katex from "katex";
export function Tex({ tex, block = false }: { tex: string; block?: boolean }) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: block });
  return <span className={block ? "eq" : undefined} dangerouslySetInnerHTML={{ __html: html }} />;
}
