import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { validatePublicDemos, publicDemoFor, demoCardLink, demoSection } from './public-demos.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const execute = promisify(execFile);
const locales = ['ko', 'ja', 'en'];
const data = Object.fromEntries(await Promise.all(locales.map(async locale => [locale, JSON.parse(await readFile(resolve(root, `content/${locale}.json`), 'utf8'))])));
const siteScript = await readFile(resolve(root, 'assets/site.js'), 'utf8');
const fixture = enabled => ({
  updream: { username: 'fixture-member-ID', password: 'fixture-member<&"\'>', enabled: enabled.includes('updream') },
  'updream-admin': { username: 'fixture-admin-ID', password: 'fixture-admin<&"\'>', enabled: enabled.includes('updream-admin') },
});

test('public demo config requires both known apps and complete enabled accounts', () => {
  const empty = { updream: { username: '', password: '', enabled: false }, 'updream-admin': { username: '', password: '', enabled: false } };
  assert.equal(validatePublicDemos(empty), empty);
  assert.equal(publicDemoFor(empty, 'updream'), null);
  assert.equal(publicDemoFor(fixture(['updream']), 'naerim'), null);
  assert.throws(() => validatePublicDemos({ ...empty, naerim: empty.updream }));
  assert.throws(() => validatePublicDemos({ ...empty, updream: { ...empty.updream, enabled: true } }));
  assert.throws(() => validatePublicDemos({ ...empty, updream: { ...empty.updream, enabled: 'true' } }));
});

for (const locale of locales) test(`${locale}: sections escape credentials and use localized accessible copy labels`, () => {
  const content = data[locale];
  const member = content.projects.find(project => project.id === 'updream');
  const demo = fixture(['updream']);
  const html = demoSection(content, member, demo);
  assert.ok(html.includes('fixture-member&lt;&amp;&quot;&#39;&gt;'));
  assert.ok(html.includes(content.demo.copyUsername));
  assert.ok(html.includes(content.demo.copyPassword));
  assert.ok(html.includes('aria-labelledby="demo-title"'));
  assert.ok(html.includes('aria-describedby="demo-notice demo-manual"'));
  assert.equal((html.match(/ hidden>/g) || []).length, 2, 'copy buttons are hidden until JavaScript initializes');
  assert.ok(!html.includes('fixture-admin'));
  assert.ok(demoCardLink(content, member, demo).includes(`/${locale}/projects/updream/#demo`));
  for (const project of content.projects) {
    assert.equal(demoSection(content, project, fixture([])), '');
    assert.equal(demoCardLink(content, project, fixture([])), '');
  }
});

test('full builds independently gate each demo, with no disabled placeholders on any page', async t => {
  const directory = await mkdtemp(resolve(tmpdir(), 'portfolio-demo-test-'));
  const original = await readFile(resolve(root, 'content/public-demos.json'), 'utf8');
  try {
    await Promise.all(['scripts', 'content', 'assets', 'CNAME'].map(item => cp(resolve(root, item), resolve(directory, item), { recursive: true })));
    for (const enabled of [[], ['updream'], ['updream-admin'], ['updream', 'updream-admin']]) {
      await t.test(enabled.length ? enabled.join(' + ') : 'both disabled', async () => {
        await writeFile(resolve(directory, 'content/public-demos.json'), JSON.stringify(fixture(enabled)));
        await execute(process.execPath, ['scripts/build.mjs'], { cwd: directory });
        const result = await execute(process.execPath, ['scripts/check.mjs'], { cwd: directory });
        assert.ok(result.stdout.includes('PASS:'));
        const pages = ['index.html', ...locales.flatMap(locale => [`${locale}/index.html`, ...data[locale].projects.map(project => `${locale}/projects/${project.id}/index.html`)])];
        for (const page of pages) {
          const html = await readFile(resolve(directory, page), 'utf8');
          for (const id of ['updream', 'updream-admin']) {
            const shouldContainAccount = enabled.includes(id) && page.includes(`/projects/${id}/`);
            assert.equal(html.includes(fixture(enabled)[id].username), shouldContainAccount, `${page}: ${id} credential visibility`);
          }
        }
      });
    }
    assert.equal(await readFile(resolve(root, 'content/public-demos.json'), 'utf8'), original, 'fixtures must not alter real configuration');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

function clipboardHarness({ locale = 'en', clipboard, legacy } = {}) {
  const status = { textContent: '' };
  const state = { focused: null, selected: null };
  const inputs = Object.fromEntries(['username', 'password'].map(field => [`demo-${field}`, {
    value: `synthetic-${field}`,
    focus() { state.focused = `demo-${field}`; },
    select() { state.selected = `demo-${field}`; },
    setSelectionRange(start, end) { assert.equal(start, 0); assert.equal(end, this.value.length); },
  }]));
  const copy = data[locale].demo;
  const buttons = ['username', 'password'].map(field => ({
    hidden: true,
    disabled: false,
    dataset: { copyCredential: `demo-${field}`, copied: copy[field === 'username' ? 'copiedUsername' : 'copiedPassword'], copyFallback: copy.copyFallback },
    addEventListener(event, handler) { assert.equal(event, 'click'); this.click = handler; },
    focus() { if (!this.disabled) state.focused = `${field}-button`; },
  }));
  runInNewContext(siteScript, {
    document: {
      documentElement: { classList: { add() {} } },
      querySelector: selector => selector === '#demo-copy-status' ? status : null,
      querySelectorAll: selector => selector === '[data-copy-credential]' ? buttons : [],
      getElementById: id => inputs[id],
      execCommand: legacy,
    },
    navigator: { clipboard },
    window: { addEventListener() {} },
  });
  return { status, state, inputs, buttons };
}

test('clipboard API copies the selected credential and announces localized success', async () => {
  const writes = [];
  const harness = clipboardHarness({ locale: 'ko', clipboard: { writeText: async text => { writes.push(text); } } });
  assert.ok(harness.buttons.every(button => !button.hidden));
  await harness.buttons[0].click();
  assert.deepEqual(writes, ['synthetic-username']);
  assert.equal(harness.status.textContent, data.ko.demo.copiedUsername);
  assert.ok(harness.buttons.every(button => !button.disabled));
});

test('denied clipboard permission falls back to copying a selected field', async () => {
  const commands = [];
  const harness = clipboardHarness({ locale: 'ja', clipboard: { writeText: async () => { throw new Error('denied'); } }, legacy: command => { commands.push(command); return true; } });
  await harness.buttons[1].click();
  assert.deepEqual(commands, ['copy']);
  assert.equal(harness.state.selected, 'demo-password');
  assert.equal(harness.status.textContent, data.ja.demo.copiedPassword);
  assert.equal(harness.state.focused, 'password-button');
});

test('unavailable clipboard leaves text selected with manual-copy guidance in every locale', async () => {
  for (const locale of locales) {
    const harness = clipboardHarness({ locale, legacy: () => { throw new Error('unsupported'); } });
    await harness.buttons[1].click();
    assert.equal(harness.status.textContent, data[locale].demo.copyFallback);
    assert.equal(harness.state.selected, 'demo-password');
    assert.equal(harness.state.focused, 'demo-password');
    assert.ok(harness.buttons.every(button => !button.disabled));
  }
});

test('copy operations are serialized across both buttons', async () => {
  let finish;
  const writes = [];
  const harness = clipboardHarness({ clipboard: { writeText: text => { writes.push(text); return new Promise(resolve => { finish = resolve; }); } } });
  const pending = harness.buttons[0].click();
  assert.ok(harness.buttons.every(button => button.disabled));
  await harness.buttons[1].click();
  assert.deepEqual(writes, ['synthetic-username']);
  finish();
  await pending;
  assert.ok(harness.buttons.every(button => !button.disabled));
  assert.equal(harness.status.textContent, data.en.demo.copiedUsername);
});
