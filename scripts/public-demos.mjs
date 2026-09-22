import assert from 'node:assert/strict';

const projectIds = ['updream', 'updream-admin'];
const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]));

export function validatePublicDemos(demos) {
  assert.deepEqual(Object.keys(demos).sort(), [...projectIds].sort(), 'Public demos must contain only the member and administrator apps');
  for (const id of projectIds) {
    const demo = demos[id];
    assert.ok(demo && typeof demo === 'object' && !Array.isArray(demo), `${id}: expected a demo record`);
    assert.deepEqual(Object.keys(demo).sort(), ['enabled', 'password', 'username'], `${id}: unexpected demo fields`);
    assert.equal(typeof demo.enabled, 'boolean', `${id}: enabled must be a boolean`);
    for (const field of ['username', 'password']) {
      assert.equal(typeof demo[field], 'string', `${id}: ${field} must be a string`);
      if (demo.enabled) assert.ok(demo[field].trim(), `${id}: enabled demos need a nonempty ${field}`);
    }
  }
  return demos;
}

export function publicDemoFor(demos, id) {
  return projectIds.includes(id) && demos[id]?.enabled === true ? demos[id] : null;
}

export function demoCardLink(content, project, demos) {
  if (!publicDemoFor(demos, project.id)) return '';
  return `<a class="text-link demo-card-link" href="/${content.locale}/projects/${project.id}/#demo">${escape(content.demo.link)} <span aria-hidden="true">→</span></a>`;
}

export function demoSection(content, project, demos) {
  const demo = publicDemoFor(demos, project.id);
  if (!demo) return '';
  const copy = content.demo;
  const field = (key, label, buttonLabel, copied) => `<div class="demo-field"><label for="demo-${key}">${escape(label)}</label><div class="demo-field-control"><input id="demo-${key}" type="text" value="${escape(demo[key])}" readonly autocomplete="off" autocapitalize="off" spellcheck="false" aria-describedby="demo-notice demo-manual"><button type="button" class="button button-outline demo-copy" data-copy-credential="demo-${key}" data-copied="${escape(copied)}" data-copy-fallback="${escape(copy.copyFallback)}" aria-label="${escape(project.name)} · ${escape(buttonLabel)}" aria-describedby="demo-copy-status" hidden>${escape(buttonLabel)}</button></div></div>`;
  return `<section class="section demo-section" id="demo" aria-labelledby="demo-title">
<p class="eyebrow">${escape(copy.kicker)}</p><h2 id="demo-title">${escape(copy.title)}</h2><p class="section-intro">${escape(copy.intro)}</p>
<div class="demo-panel"><div><h3>${escape(copy.stepsTitle)}</h3><ol class="demo-steps">${copy.steps.map(step => `<li>${escape(step)}</li>`).join('')}</ol><a class="text-link" href="${escape(project.store)}">${escape(copy.install)} <span aria-hidden="true">↗</span></a><div class="demo-features"><h3>${escape(copy.featuresTitle)}</h3><ul>${copy.features[project.id].map(feature => `<li>${escape(feature)}</li>`).join('')}</ul></div></div>
<div class="demo-credentials"><h3>${escape(copy.credentialsTitle)}</h3>${field('username', copy.username, copy.copyUsername, copy.copiedUsername)}${field('password', copy.password, copy.copyPassword, copy.copiedPassword)}<p class="demo-manual" id="demo-manual">${escape(copy.manualCopy)}</p><p class="demo-copy-status" id="demo-copy-status" role="status" aria-live="polite" aria-atomic="true"></p></div></div>
<p class="demo-notice" id="demo-notice">${escape(copy.notice)}</p>
</section>`;
}
