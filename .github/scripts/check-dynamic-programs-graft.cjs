/* Independently prove that the prepared overlay preserves the inspected runtime. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert/strict');
const ts = require('typescript');
const site = path.resolve(process.argv[2] || '');
const payload = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const parse = (name, body) => ts.createSourceFile(name, body, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const manifest = payload.preservedModuleManifest;
assert.equal(sha(fs.readFileSync(path.join(site, 'index.html'))), payload.expectedFrontend.htmlSha256);
const suffix = '-dynamic-programs-' + payload.version;
const reverse = new Map(Object.keys(payload.expectedFrontend.files).map(name => [name.replace(/\.js$/, suffix + '.js'), name]));
let unchanged = 0, restored = 0;
for (const [name, expected] of Object.entries(payload.expectedFrontend.files)) {
  const before = fs.readFileSync(path.join(site, 'assets', name), 'utf8');
  assert.equal(sha(before), expected, 'Baseline drift: ' + name);
  const mapped = name.replace(/\.js$/, suffix + '.js');
  if (!payload.frontend.files[mapped]) { unchanged++; continue; }
  let after = payload.frontend.files[mapped].replace(/[\w.$-]+\.js/g, ref => reverse.get(ref) || ref);
  after = after.replace(/^import \{[^}]+\} from '\.\/TopCoachPrograms[^']+';\n/, '');
  after = after.replace(/\nexport \{[\w$]+ as __Preserved(?:SharedApplications|SessionChatButton)\};\n/g, '');
  const beforeAst = parse(name, before);
  for (const target of manifest.targets.filter(target => target.file === name)) {
    const original = beforeAst.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === target.function);
    const afterAst = parse(name, after);
    const wrapper = afterAst.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === target.function);
    assert(original && wrapper, 'Missing declared target: ' + name);
    assert.equal(sha(original.getText(beforeAst)), target.beforeSha256);
    assert.equal(wrapper.getText(afterAst), `function ${target.function}(props){return __${target.replacement}(props)}`);
    after = after.slice(0, wrapper.getStart(afterAst)) + original.getText(beforeAst) + after.slice(wrapper.end);
    restored++;
  }
  assert.equal(after, before, 'Unexpected implementation change: ' + name);
}
assert.equal(restored, 7);
for (const item of manifest.preservedFunctions) {
  const body = fs.readFileSync(path.join(site, 'assets', item.file), 'utf8');
  const sf = parse(item.file, body);
  const node = sf.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === item.function);
  assert(node);
  assert.equal(sha(node.getText(sf)), item.sha256, 'Preserved integration drift: ' + item.role);
}
const bundle = payload.frontend.files[manifest.generated.bundleName];
assert(bundle.includes('expectedUpdatedAt'), 'Progress concurrency field missing');
assert(bundle.includes('/academic-programs/enrollments/'), 'Scoped progress endpoint missing');
assert(bundle.includes('overrideExisting:!0'), 'Existing enrollment query override missing');
for (const input of manifest.sourceInputs) {
  assert(!input.includes('src/lib/socket/'), 'A second socket singleton was bundled');
  assert(!input.endsWith('src/app/store.ts'), 'A second Redux store was bundled');
  assert(!input.includes('src/hooks/useOrgStaff.ts'), 'Live organization policy must be reused');
  assert(!input.includes('src/pages/mentor/console/components/SharedApplications.tsx'), 'Live shared applications must be reused');
}
for (const name of Object.keys(payload.frontend.files)) assert(!fs.existsSync(path.join(site, 'assets', name)), 'Overlay would overwrite an existing immutable asset');
console.log(JSON.stringify({verified:true,baselineModules:manifest.baselineModules,restoredTargetFunctions:restored,unmappedModulesRetained:unchanged,preservedIntegrations:manifest.preservedFunctions.length,existingBodiesAndPoliciesUnchanged:true,noDuplicateStoreOrSocket:true,version:payload.version}));
