/**
 * Plain-text versions of the legal pages, built from the rendered page so the
 * downloaded file can never drift from what users read on screen.
 */

const squash = (s: string | null): string => (s || '').replace(/\s+/g, ' ').trim();

/** Text of an element without the text of its nested lists. */
function ownText(el: Element): string {
  const clone = el.cloneNode(true) as Element;
  clone.querySelectorAll('ul, ol').forEach(list => list.remove());
  return squash(clone.textContent);
}

function listLines(list: Element, depth: number, out: string[]): void {
  for (const li of Array.from(list.children).filter(c => c.tagName === 'LI')) {
    out.push(`${'  '.repeat(depth)}- ${ownText(li)}`);
    li.querySelectorAll(':scope > ul, :scope > ol').forEach(sub => listLines(sub, depth + 1, out));
  }
}

export function policyTextFromPage(root: HTMLElement): string {
  const page = root.cloneNode(true) as HTMLElement;
  page.querySelectorAll('button, .back-link, .policy-footer-cta').forEach(el => el.remove());

  const out: string[] = [];
  const walk = (el: Element): void => {
    for (const child of Array.from(el.children)) {
      const tag = child.tagName;
      if (tag === 'H1') {
        out.push(squash(child.textContent).toUpperCase());
      } else if (tag === 'H2') {
        out.push('', squash(child.textContent).toUpperCase(), '');
      } else if (tag === 'H3') {
        out.push('', squash(child.textContent));
      } else if (tag === 'P') {
        const text = squash(child.textContent);
        if (!text) continue;
        // The "Last Updated" line sits right under the title; other paragraphs get a blank line.
        const isMeta = Array.from(child.classList).some(c => c.endsWith('-meta'));
        if (!isMeta) out.push('');
        out.push(text);
      } else if (tag === 'UL' || tag === 'OL') {
        listLines(child, 0, out);
      } else {
        walk(child);
      }
    }
  };
  walk(page);

  out.push('', '(c) Breedly. https://breedly.us', '');
  return out.join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+/, '');
}

export function downloadTextFile(text: string, fileName: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
