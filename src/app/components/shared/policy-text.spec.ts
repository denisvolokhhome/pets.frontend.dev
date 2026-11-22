import { policyTextFromPage } from './policy-text';

describe('policyTextFromPage', () => {
  function page(html: string): HTMLElement {
    const el = document.createElement('div');
    el.innerHTML = html;
    return el;
  }

  it('turns the rendered policy into plain text without the page buttons', () => {
    const el = page(`
      <h1 class="policy-title">Privacy Policy</h1>
      <p class="policy-meta">Last Updated: May 1, 2026</p>
      <button class="download-btn">Download Privacy Policy</button>
      <section>
        <h2>1. Introduction</h2>
        <p>Breedly   is
           free.</p>
        <h3>1.1 Scope</h3>
        <ul><li>Email <a href="mailto:a@b.c">a@b.c</a></li><li>Name</li></ul>
      </section>
      <div class="policy-footer-cta"><button>Download</button><a class="back-link">Back to Home</a></div>
    `);

    expect(policyTextFromPage(el)).toBe([
      'PRIVACY POLICY',
      'Last Updated: May 1, 2026',
      '',
      '1. INTRODUCTION',
      '',
      'Breedly is free.',
      '',
      '1.1 Scope',
      '- Email a@b.c',
      '- Name',
      '',
      '(c) Breedly. https://breedly.us',
      '',
    ].join('\n'));
  });

  it('keeps the Last Updated line under the title on every legal page', () => {
    for (const cls of ['legal-meta', 'terms-meta']) {
      const el = page(`<h1>Cookie Policy</h1><p class="${cls}">Last Updated: May 1, 2026</p><h2>1. A</h2>`);
      expect(policyTextFromPage(el)).toMatch(/^COOKIE POLICY\nLast Updated: May 1, 2026\n\n1\. A\n/);
    }
  });

  it('keeps nested list items once and in order', () => {
    const el = page('<h1>T</h1><ul><li>Laws, including:<ul><li>AWA</li></ul></li><li>Last</li></ul>');
    expect(policyTextFromPage(el)).toContain('- Laws, including:\n  - AWA\n- Last');
  });
});
