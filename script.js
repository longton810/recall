// Shared options for all preceptor dropdowns.
['notePreceptor', 'noteCodesPreceptor', 'noteSwipePreceptor'].forEach(id => {
  document.getElementById(id).append(document.getElementById('recallPreceptorOptions').content.cloneNode(true));
});

const recallNoteFieldIds = ['noteNV','notePreceptor','notePreceptorOther','noteCodesDifferent','noteCodesPreceptor','noteCodesOther','noteSwipeDifferent','noteSwipePreceptor','noteSwipeOther'];
function updateRecallPreceptors() {
  byId('notePreceptorOther').hidden = byId('notePreceptor').value !== 'Others';
  for (const role of ['Codes','Swipe']) {
    byId('note'+role+'Fields').hidden = !byId('note'+role+'Different').checked;
    byId('note'+role+'Other').hidden = byId('note'+role+'Preceptor').value !== 'Others';
  }
}
function readRecallNoteFields() {
  return Object.fromEntries(recallNoteFieldIds.map(id => [id, byId(id).type === 'checkbox' ? byId(id).checked : byId(id).value]));
}
function restoreRecallNoteFields(data = {}) {
  recallNoteFieldIds.forEach(id => {
    const input = byId(id);
    if (input.type === 'checkbox') input.checked = data[id] === true;
    else input.value = typeof data[id] === 'string' ? data[id] : '';
  });
  updateRecallPreceptors();
}
function renderRecallPreceptorNote(output) {
  const data = readRecallNoteFields();
  const name = role => data['note'+role+'Preceptor'] === 'Others' ? (data[role ? 'note'+role+'Other' : 'notePreceptorOther'] || '').trim() : data['note'+role+'Preceptor'];
  for (const [label,value] of [['NV',data.noteNV],['Student Dr','Long Ton'],['Preceptor',name('')]]) {
    const entry = document.createElement('div'); entry.className = 'chart-entry recall-preceptor-note';
    if (label === 'NV') entry.classList.add('note-nv-start');
    const text = document.createElement('span'); text.className = 'chart-text preceptor-narrative';
    const title = document.createElement('strong'); title.textContent = label+':';
    text.append(title,' '+value); entry.append(text); output.append(entry);
  }
  const different = ['Codes','Swipe'].filter(role => data['note'+role+'Different'] && name(role)).map(role => name(role)+(role === 'Codes' ? ' - for completed codes' : ' - for swiping note'));
  if (different.length) {
    const entry = document.createElement('div'); entry.className = 'chart-entry recall-preceptor-note';
    const text = document.createElement('span'); text.className = 'chart-text preceptor-narrative';
    const title = document.createElement('strong'); title.textContent = '('+different.join(', ')+')';
    text.append(title); entry.append(text); output.append(entry);
  }
  const clinicEntry = document.createElement('div'); clinicEntry.className = 'chart-entry recall-preceptor-note';
  const clinicText = document.createElement('span'); clinicText.className = 'chart-text preceptor-narrative';
  const clinicTitle = document.createElement('strong'); clinicTitle.textContent = 'Clinic:';
  clinicText.append(clinicTitle, ' POD2 - 242'); clinicEntry.append(clinicText); output.append(clinicEntry);

}

let recallNoteEdits = {};
function cleanRecallNoteFragment(html) {
  const template = document.createElement('template'); template.innerHTML = html;
  const allowed = new Set(['STRONG','B','BR','DIV','P','EM','I','U']);
  const clean = node => {
    if (node.nodeType === 3) return document.createTextNode(node.textContent);
    const fragment = document.createDocumentFragment();
    if (node.nodeType !== 1) return fragment;
    const target = allowed.has(node.tagName) ? document.createElement(node.tagName.toLowerCase()) : fragment;
    node.childNodes.forEach(child => target.append(clean(child)));
    return target;
  };
  const container = document.createElement('div');
  template.content.childNodes.forEach(node => container.append(clean(node)));
  return container.innerHTML;
}
function enableRecallNoteEditing(output) {
  const counts = new Map();
  output.querySelectorAll('.chart-text').forEach(text => {
    if (text.classList.contains('chart-tag-list') || text.isContentEditable || text.classList.contains('note-blank-text')) return;
    const label = text.querySelector('strong')?.textContent || '';
    const base = text.className+'|'+label;
    const index = counts.get(base) || 0; counts.set(base,index+1);
    const key = base+'|'+index;
    if (typeof recallNoteEdits[key] === 'string') text.innerHTML = cleanRecallNoteFragment(recallNoteEdits[key]);
    text.contentEditable = 'true'; text.spellcheck = true;
    text.setAttribute('role','textbox'); text.setAttribute('aria-label','Edit '+(label || 'Note text'));
    text.addEventListener('input', () => {
      recallNoteEdits[key] = cleanRecallNoteFragment(text.innerHTML); saveOdontogram();
    });
  });
}

function updateOcclusalClassFields() {
  byId("ioClassDivision").hidden = byId("ioOcclusalClass").value !== "II";
  byId('malocclusionOptions').hidden = !byId('malocclusionEnabled').checked;
  byId('malocclusionDetails').hidden = !byId('malocclusionEnabled').checked || !['Crossbite','Crowding','Spacing'].includes(byId('malocclusionType').value);
  const angular=['I','II','III'].includes(byId('ioOcclusalClass').value);
  const unilateral=angular && query('input[name="io-class-laterality"]:checked')?.value==='unilateral';
  const side=unilateral ? query('input[name="io-class-side"]:checked')?.value : '';
  byId('ioClassLaterality').hidden=!angular;
  byId('ioClassSide').hidden=!unilateral;
  byId('ioRemainingClassRow').hidden=!side;
  byId('ioRemainingClassLabel').textContent=side ? 'Class for the '+(side==='right' ? 'left' : 'right')+' side' : 'Class for remaining side';
}

function readRecallDentitionOcclusion() {
  return {
    dentition: Object.fromEntries(['maxillae','mandible'].map(jaw => [jaw, query(`input[name="rx-dentition-${jaw}"]:checked`)?.value || ''])),
    occlusion: {malocclusionEnabled: byId('malocclusionEnabled').checked, ...Object.fromEntries([...all('.io-occlusion-input')].map(input => [input.dataset.occlusion, input.value])),
      laterality: query('input[name="io-class-laterality"]:checked')?.value || '', side: query('input[name="io-class-side"]:checked')?.value || ''}
  };
}
function restoreRecallDentitionOcclusion(data = {}) {
  byId('malocclusionEnabled').checked = data.occlusion?.malocclusionEnabled === true;
  all('.rx-dentition-choice').forEach(input => { input.checked = input.value === data.dentition?.[input.dataset.jaw]; });
  all('.io-occlusion-input').forEach(input => { input.value = typeof data.occlusion?.[input.dataset.occlusion] === 'string' ? data.occlusion[input.dataset.occlusion] : ''; });
  for (const [name,key] of [['io-class-laterality','laterality'],['io-class-side','side']]) all(`input[name="${name}"]`).forEach(input => { input.checked = input.value === data.occlusion?.[key]; });
  updateOcclusalClassFields();
}
function recallDentitionOcclusionNote() {
  const {dentition: d, occlusion: o} = readRecallDentitionOcclusion();
  const lines = [];
  const word = value => value === 'Full permanent' ? 'Full permanent dentition' : value;
  if (d.maxillae && d.maxillae === d.mandible) lines.push(word(d.maxillae)+' in both arches.');
  else {
    if (d.maxillae) lines.push(word(d.maxillae)+' in the maxillae.');
    if (d.mandible) lines.push(word(d.mandible)+' in the mandible.');
  }
  const parts = [];
  if (o.class) {
    let text = 'Class '+o.class;
    if (o.class === 'II' && o.division) text += ' '+o.division;
    if (['I','II','III'].includes(o.class)) {
      if (o.laterality === 'bilateral') text += ' bilateral';
      if (o.laterality === 'unilateral') {
        text += ' unilateral'+(o.side ? ' on the '+o.side+' side' : '');
        if (o.side && o.remainingClass) text += ', Class '+o.remainingClass+' on the '+(o.side === 'right' ? 'left' : 'right')+' side';
      }
    }
    parts.push(text);
  }
  if (o.overbite.trim()) parts.push('Overbite '+o.overbite.trim()+'%');
  if (o.overjet.trim()) parts.push('Overjet '+o.overjet.trim()+' mm');
  if (o.malocclusionEnabled && o.malocclusionType) parts.push('Malocclusion: '+o.malocclusionType+(['Crossbite','Crowding','Spacing'].includes(o.malocclusionType) && o.malocclusionDetails.trim() ? ' '+o.malocclusionDetails.trim() : ''));
  if (parts.length) lines.push('Occlusal classification: '+parts.join('. ')+'.');
  return lines;
}

const cleaningFields = [["cavitron", "Cavitron used"], ["handscaler", "204S handscaler used"], ["prophyWiz", "Prophy Wiz used"], ["floss", "Floss string"], ["fluoride", "Topical fluoride varnish"]];
function readCleaningOptions() {
  return {
    choices: Object.fromEntries(cleaningFields.map(([key]) => [key, query(`input[name="cleaning-${key}"]:checked`)?.value || ''])),
    floss: [...all('.cleaning-floss-choice:checked')].map(input => input.value)
  };
}
function restoreCleaningOptions(saved = {}) {
  cleaningFields.forEach(([key]) => all(`input[name="cleaning-${key}"]`).forEach(input => { input.checked = input.value === saved.choices?.[key]; }));
  all('.cleaning-floss-choice').forEach(input => { input.checked = Array.isArray(saved.floss) && saved.floss.includes(input.value); });
}
function cleaningNoteParagraphs(data = readCleaningOptions()) {
  const sentences = [];
  const cavitron = data.choices.cavitron === 'yes';
  const scaler = data.choices.handscaler === 'yes';
  if (cavitron && scaler) sentences.push('A Cavitron and a 204S hand scaler were used to remove all plaque and calculus.');
  else if (cavitron) sentences.push('A Cavitron was used to remove all plaque and calculus.');
  else if (scaler) sentences.push('A 204S hand scaler was used to remove all plaque and calculus.');
  if (data.choices.prophyWiz === 'yes') sentences.push('All tooth surfaces were polished using Prophy Wiz with medium-grit fluoride-containing prophylaxis paste.');
  if (data.choices.floss === 'yes') sentences.push('Dental floss was used to clean all interproximal surfaces.');
  if (data.floss.includes('Superfloss')) sentences.push('Super Floss was used to clean beneath the bridges.');
  if (data.floss.includes('Interproximal floss')) sentences.push('Interproximal brushes were used to clean areas with open contacts or large interdental spaces.');
  const paragraphs = sentences.length ? [sentences.join(' ')] : [];
  if (data.choices.fluoride === 'yes') paragraphs.push('Topical fluoride varnish was applied to all teeth. The patient was advised to avoid hard or crunchy foods and sugary beverages for the next 4 hours. Soft foods and water were recommended during this period.');
  return paragraphs;
}

function noteBlank(value) { return typeof value === "string" ? value.trim() : ""; }
const extraOralFields = [["tmjTenderness", "Tenderness", "TMJ"], ["tmjSounds", "Clicking/popping sound", "TMJ"], ["mandibularFunction", "Difficulty on mandibular function", "TMJ"], ["deviation", "Deviations when the mouth is opening/closing", "TMJ"], ["muscleTenderness", "Tenderness on muscles of mastication", "Head and neck"], ["lymphadenopathy", "Lymphadenopathy on neck and head", "Head and neck"], ["softTissue", "Scars/ current injuries/moles/soft tissue findings", "Head and neck"]];
function readExtraOralExam() {
  return Object.fromEntries(extraOralFields.map(([key])=>[key,{
    choice:query(`input[name="eo-${key}"]:checked`)?.value || '',
    details:byId('eo-details-'+key).value
  }]));
}
function updateExtraOralFields() {
  extraOralFields.forEach(([key])=>{byId('eo-details-'+key).hidden=query(`input[name="eo-${key}"]:checked`)?.value!=='yes';});
}
function restoreExtraOralExam(saved={}) {
  extraOralFields.forEach(([key])=>{
    all(`input[name="eo-${key}"]`).forEach(input=>{input.checked=input.value===saved?.[key]?.choice;});
    byId('eo-details-'+key).value=typeof saved?.[key]?.details==='string' ? saved[key].details : '';
  });
  updateExtraOralFields();
}
function extraOralExamText(cohri) {
  const groups=[];
  for(const group of ['TMJ','Head and neck']) {
    const findings=extraOralFields.filter(([, ,category])=>category===group).map(([key,label])=>{
      const item=cohri.extraOralStructured?.[key];
      if(!['yes','no'].includes(item?.choice))return '';
      if(item.choice==='no') return 'No '+label.charAt(0).toLowerCase()+label.slice(1);
      const separator = ': ';
      return label+(item.details.trim() ? separator+noteBlank(item.details) : '');
    }).filter(Boolean);
    if(findings.length)groups.push(group+': '+findings.join('. ')+'.');
  }
  if(cohri.extraOralExam?.trim())groups.push(noteBlank(cohri.extraOralExam));
  return groups.join('\n');
}

const oralScreeningFields = [["vermillion", "Vermillion borders"], ["labial", "Labial mucosa"], ["buccal", "Buccal mucosa"], ["palate", "Hard and soft palate"], ["vestibular", "Mucosa of vestibular/cheeks"], ["floor", "Floor of mouth"], ["tongue", "Dorsal and ventral borders of tongue"], ["oropharynx", "Oropharynx"], ["gingiva", "Gingiva"]];
function readOralScreening() {
  return {
    findings: Object.fromEntries(oralScreeningFields.map(([key]) => [key, {
      choice: query(`input[name="oral-${key}"]:checked`)?.value || '',
      details: byId('oral-'+key+'-details').value
    }])),
    additional: byId('oralScreeningAdditional').value,
    mallampati: byId('mallampatiScore').value
  };
}
function updateOralScreening() {
  oralScreeningFields.forEach(([key]) => {
    byId('oral-'+key+'-details').hidden = query(`input[name="oral-${key}"]:checked`)?.value !== 'yes';
  });
}
function restoreOralScreening(saved = {}) {
  oralScreeningFields.forEach(([key]) => {
    all(`input[name="oral-${key}"]`).forEach(input => { input.checked = input.value === saved.findings?.[key]?.choice; });
    byId('oral-'+key+'-details').value = typeof saved.findings?.[key]?.details === 'string' ? saved.findings[key].details : '';
  });
  byId('oralScreeningAdditional').value = typeof saved.additional === 'string' ? saved.additional : '';
  byId('mallampatiScore').value = ['1','2','3','4'].includes(saved.mallampati) ? saved.mallampati : '1';
  updateOralScreening();
}
function oralScreeningNoteLines(data) {
  const normal = oralScreeningFields.filter(([key]) => data.findings[key]?.choice === 'no').map(([, label]) => label.toLowerCase());
  const lines = normal.length ? ['No pathology found on '+normal.join(', ')+'.'] : [];
  oralScreeningFields.forEach(([key, label]) => {
    const finding = data.findings[key];
    if (finding?.choice === 'yes') lines.push(label+':'+(finding.details.trim() ? ' '+finding.details.trim()+(finding.details.trim().endsWith('.') ? '' : '.') : ''));
  });
  lines.push('Tonsillar pillars (Mallampati score): Class '+data.mallampati+'.');
  if (data.additional?.trim()) lines.push(data.additional.trim());
  return lines;
}
function renderOralScreeningNote(output) {
  const entry = document.createElement('div'); entry.className = 'chart-entry oral-screening-note-heading';
  const text = document.createElement('span'); text.className = 'chart-text oral-screening-narrative';
  const heading = document.createElement('strong'); heading.textContent = 'Oral cancer screening:';
  text.append(heading);
  oralScreeningNoteLines(readOralScreening()).forEach(value => {
    text.append(' ');
    if (oralScreeningFields.some(([, label]) => value.startsWith(label+':'))) {
      const sentence = document.createElement('strong'); sentence.textContent = value; text.append(sentence);
    } else text.append(value);
  });
  entry.append(text); output.append(entry);
}

const chartTagStyle = document.createElement("style");
chartTagStyle.textContent = `
  .chart-entry.chart-tag-entry { display: flex; flex-direction: column; align-items: stretch; gap: 4px; }
  .chart-tag-list { display: block; }
  .chart-tag-list > .chart-tag { margin: 2px 0; vertical-align: middle; }
  .chart-inline-text { display: inline-block; min-width: 7px; min-height: 1em;
    vertical-align: middle; white-space: pre-wrap; outline: none; }
  .chart-inline-text:focus { box-shadow: 0 1px 0 #8197b4; }
  .chart-treatment-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: start; gap: 18px; width: 100%; max-width: 1450px;
    margin-top: 18px; padding: 0; border: 0; }
  .chart-treatment-layout > .clinical-panel {
    min-width: 0; margin: 0; padding: 14px; box-sizing: border-box;
    border: 1px solid var(--glass-border, rgba(118,145,175,.3));
    border-radius: 18px; background: var(--glass, rgba(245,250,255,.8));
  }
  .chart-treatment-layout .chart-side-panel #output {
    border: 0; background: transparent; box-shadow: none; padding: 0;
    backdrop-filter: none; -webkit-backdrop-filter: none;
  }
  .chart-treatment-layout .treatment-section {
    display: flex; flex-direction: column; gap: 6px; padding: 0;
    border: 0; background: transparent; box-shadow: none;
  }
  .chart-treatment-layout .treatment-section .category-pair { display: contents; }
  .chart-treatment-layout .treatment-section .finding-row {
    display: flex; flex: 0 0 auto; width: 100%; box-sizing: border-box;
    flex-wrap: wrap; align-items: center; gap: 4px; margin: 0;
  }
  .chart-treatment-layout .treatment-section .finding-row::after { content: none; }
  .chart-treatment-layout h2 { margin: 0 0 8px; }
  .chart-treatment-layout .chart-side-panel #output { width: 100%; max-width: 100%; box-sizing: border-box; }
  .chart-treatment-layout > .sticky-treatment-panel {
    position: sticky; top: 16px; align-self: start;
    max-height: calc(100vh - 32px); max-height: calc(100dvh - 32px);
    overflow-y: auto; box-shadow: var(--panel-shadow, 0 8px 24px rgba(30,60,100,.08));
    backdrop-filter: blur(22px); -webkit-backdrop-filter: blur(22px);
  }
  @media (max-width: 850px) {
    .chart-treatment-layout { grid-template-columns: 1fr; }
    .chart-treatment-layout > .sticky-treatment-panel { position: static; max-height: none; }
  }
  .chart-tooth-label { font-weight: 700; margin-right: 3px; }
  .chart-tag { display: inline-flex; align-items: center; gap: 5px; padding: 3px 7px;
    border: 1px solid rgba(118,145,175,.3); border-radius: 9px;
    background: rgba(245,250,255,.85); }
  .chart-treatment-tag { background: rgba(255,249,214,.85); }
  .chart-tag-text { outline: none; }
  .chart-finding-select, .chart-tooth-label { font: inherit; color: inherit; cursor: pointer; }
  .chart-finding-select { padding: 0; border: 0; background: transparent; }
  .chart-tooth-label { font-weight: 700; }
  .chart-finding-select.selected { color: #1d5bbb; text-decoration: underline; }
  .chart-tooth-label.selected { border-color: #548de0; background: #e3efff; }
  .chart-finding-select:focus-visible, .chart-tooth-label:focus-visible { outline: 2px solid #548de0; }
  .delete-chart-tag { flex: none; border: 0; background: transparent; padding: 0 2px;
    color: #65758a; font: bold 13px/1 Arial,sans-serif; cursor: pointer; }
  .delete-chart-tag:hover { color: #c62828; }
  .chart-saved-note { font: inherit; color: inherit; }
`;
document.head.append(chartTagStyle);

const query = selector => document.querySelector(selector);
const all = selector => document.querySelectorAll(selector);
const byId = id => document.getElementById(id);

function capitalizeClinicalAbbreviations(text) {
  return text.replace(/\b(?:NSF|PARL|PARO|IRM|SSC|PFM|SDF|RMGI|RCT|CBU)\b/gi, abbreviation => abbreviation.toUpperCase());
}

function formatFindingText(surface, finding) {
  const name = finding.toLowerCase();
  const text = surface ? surface + " " + name : name.charAt(0).toUpperCase() + name.slice(1);
  return capitalizeClinicalAbbreviations(text);
}

function recordText(record) {
  const surface = record.whole ? "" : formatSurfaceText(record.surfaces);
  return formatFindingText(surface, record.finding);
}

function setDentitionButtons(mode) {
  all(".dentition-button").forEach(button => {
    const active = button.dataset.dentition === mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function setAttributes(element, attributes) {
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
}

function refreshChart() {
  updateFindingButtons();
  renderFindings();
  renderChart();
}

function finishSelection() {
  clearTemporarySelection();
  selections = [];
  refreshChart();
}

let selections = [];
let findings = [];
let nextBatchId = 1;
let chartEdits = {};
let nextChartTagId = 1;
const anteriorTeeth = [ 6, 7, 8, 9, 10, 11, 22, 23, 24, 25, 26, 27 ];
const maxillaryTeeth = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 ];
const mandibularTeeth = [ 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17 ];
const primaryToothMap = {
  4: "A", 5: "B", 6: "C", 7: "D", 8: "E", 9: "F", 10: "G", 11: "H", 12: "I", 13: "J",
  20: "K", 21: "L", 22: "M", 23: "N", 24: "O", 25: "P", 26: "Q", 27: "R", 28: "S", 29: "T"
};
const positionFindings = [ "mobility", "tilted", "rotated", "super-eruption", "erupting", "impacted", "unerupted" ];
const mixedPermanentTeeth = [ 3, 14, 19, 30, 7, 8, 9, 10, 23, 24, 25, 26 ];
createArch("maxillary", maxillaryTeeth);
createArch("mandibular", mandibularTeeth);
updateFindingButtons();

function createArch(containerID, teeth) {
  const container = byId(containerID);
  teeth.forEach((toothNumber, index) => {
    const tooth = createTooth(toothNumber);
    if (index === 7) tooth.classList.add("midline");
    container.appendChild(tooth);
  });
}

function createTooth(toothNumber) {
  const wrapper = document.createElement("div");
  wrapper.className = "tooth";
  wrapper.dataset.tooth = toothNumber;
  const isAnterior = anteriorTeeth.includes(toothNumber);
  const centerSurface = isAnterior ? "I" : "O";
  const outerSurface = isAnterior ? "F" : "B";
  const isRightSide = (toothNumber >= 1 && toothNumber <= 8) || (toothNumber >= 25 && toothNumber <= 32);
  const leftSurface = isRightSide ? "D" : "M";
  const rightSurface = isRightSide ? "M" : "D";
  const isMandibular = toothNumber >= 17 && toothNumber <= 32;
  const topSurface = isMandibular ? "L" : outerSurface;
  const bottomSurface = isMandibular ? outerSurface : "L";
  wrapper.innerHTML = ` <svg class="tooth-diagram" viewBox="0 0 120 205" data-tooth="${toothNumber}" >
    <path class="surface" data-surface="${topSurface}" d="M 13.515 13.515 Q 17.029 10 22 10 H 98 Q 102.971 10 106.485 13.515 L 85 35 H 35 Z" >
    </path>
    <path class="surface" data-surface="${leftSurface}" d="M 13.515 13.515 L 35 35 V 85 L 13.515 106.485 Q 10 102.971 10 98 V 22 Q 10 17.029 13.515 13.515 Z" >
    </path>
    <rect class="surface" data-surface="${centerSurface}" x="35" y="35" width="50" height="50" >
    </rect>
    <path class="surface" data-surface="${rightSurface}" d="M 106.485 13.515 Q 110 17.029 110 22 V 98 Q 110 102.971 106.485 106.485 L 85 85 V 35 Z" >
    </path>
    <path class="surface" data-surface="${bottomSurface}" d="M 13.515 106.485 L 35 85 H 85 L 106.485 106.485 Q 102.971 110 98 110 H 22 Q 17.029 110 13.515 106.485 Z" >
    </path>
    <g class="endo-coronal-network">
    <path class="endo-coronal-links" d="M60 60 L60 23 M60 60 L23 60 M60 60 L97 60 M60 60 L60 98" >
    </path>
    <circle cx="60" cy="23" r="9">
    </circle>
    <circle cx="23" cy="60" r="9">
    </circle>
    <circle cx="60" cy="60" r="9">
    </circle>
    <circle cx="97" cy="60" r="9">
    </circle>
    <circle cx="60" cy="98" r="9">
    </circle>
    </g>
    <text x="60" y="28">${topSurface}</text>
    <text x="23" y="65">${leftSurface}</text>
    <text x="60" y="65">${centerSurface}</text>
    <text x="97" y="65">${rightSurface}</text>
    <text x="60" y="103">${bottomSurface}</text>
    <rect class="surface cervical-surface" data-surface="C" x="15" y="135" width="90" height="40" rx="3" >
    </rect>
    <text class="cervical-label" x="60" y="155" >C</text>
    <g class="lengthening-arrows">
    <path d="M35 181 V197 M29 191 L35 197 L41 191" >
    </path>
    <path d="M60 181 V197 M54 191 L60 197 L66 191" >
    </path>
    <path d="M85 181 V197 M79 191 L85 197 L91 191" >
    </path>
    </g>
    <g class="endo-symbol">
    <path class="endo-root" d="M43 130 Q60 125 77 130 L68 169 Q60 184 52 169 Z" >
    </path>
    <path class="endo-canal" d="M50 135 H70 M60 135 L60 174" >
    </path>
    </g>
    <g class="pulpotomy-symbol">
    <path class="endo-root" d="M43 130 Q60 125 77 130 L68 169 Q60 184 52 169 Z" >
    </path>
    <rect class="pulp-chamber" x="49" y="132" width="22" height="10" rx="2" >
    </rect>
    </g>
    <g class="post-core-symbol">
    <path class="endo-root" d="M43 130 Q60 125 77 130 L68 169 Q60 184 52 169 Z" >
    </path>
    <path class="post-canal" d="M60 155 V174" >
    </path>
    <rect class="core-block" x="47" y="130" width="26" height="12" rx="2" >
    </rect>
    <path class="post-shaft" d="M60 140 V159" >
    </path>
    </g>
    <g class="implant-symbol" transform="translate(0 121) scale(1 .38)" >
    <path d="M48 14 H72 V29 L77 35 H43 L48 29 Z" fill="#ccefed" >
    </path>
    <path d="M40 36 H80 V48 L72 127 Q60 147 48 127 L40 48 Z" fill="#e8f6f5" >
    </path>
    <path d="M39 49 L80 55 M41 62 L78 68 M42 75 L77 81 M44 88 L76 94 M45 101 L74 107 M47 114 L72 120 M50 126 L68 132" fill="none" >
    </path>
    </g>
    <rect class="crown-outline" x="6" y="6" width="108" height="108" rx="8" >
    </rect>
    <path class="extraction-cross" d="M10 10 L110 175 M110 10 L10 175" >
    </path>
    </svg>
    <div class="tooth-number" data-tooth="${toothNumber}" data-age="permanent" >#${toothNumber}</div>
    <div class="tooth-findings-text" data-tooth="${toothNumber}"></div>
    <div class="root-markers" data-tooth="${toothNumber}" >
    </div>
    <div class="watch-marker" data-tooth="${toothNumber}" >
    <svg viewBox="0 0 32 20" role="img" aria-label="Watch tooth" >
    <path d="M2 10 Q16 -5 30 10 Q16 25 2 10 Z">
    </path>
    <circle cx="16" cy="10" r="4">
    </circle>
    </svg>
    </div>
    <div class="position-display" data-tooth="${toothNumber}" >
    </div> `;
  return wrapper;
}

function getToothLabel(toothNumber) {
  const numberElement = query( `.tooth-number[data-tooth="${toothNumber}"]` );
  if ( numberElement && numberElement.dataset.age === "primary" ) return "#" + primaryToothMap[toothNumber];
  return "#" + toothNumber;
}
document.addEventListener("click", event => {
  const surface = event.target.closest(".surface");
  if (!surface) return;
  selections.forEach(item => { delete item.chartFindings; });
  const svg = surface.closest(".tooth-diagram");
  const toothNumber = Number(svg.dataset.tooth);
  const surfaceName = surface.dataset.surface;
  if (hasWholeSelections()) {
    clearTemporarySelection();
    selections = [];
  }
  let toothSelection = selections.find((item) => item.tooth === toothNumber && item.whole === false);
  if (!toothSelection) {
    toothSelection = {
      tooth: toothNumber, surfaces: [], whole: false };
    selections.push(toothSelection);
  }
  if (toothSelection.surfaces.includes(surfaceName)) {
    toothSelection.surfaces = toothSelection.surfaces.filter((item) => item !== surfaceName);
    surface.classList.remove("selected");
  } else {
    toothSelection.surfaces.push(surfaceName);
    surface.classList.add("selected");
  }
  if (toothSelection.surfaces.length === 0) selections = selections.filter((item) => item !== toothSelection);
  updateFindingButtons();
});
document.addEventListener("click", event => {
  const number = event.target.closest(".tooth-number");
  if (!number) return;
  selections.forEach(item => { delete item.chartFindings; });
  const toothNumber = Number(number.dataset.tooth);
  if (hasSurfaceSelections()) {
    clearTemporarySelection();
    selections = [];
  }
  const existing = selections.find((item) => item.tooth === toothNumber && item.whole === true);
  if (existing) {
    selections = selections.filter((item) => item !== existing);
    number.classList.remove("selected");
  } else {
    selections.push({
      tooth: toothNumber, surfaces: [], whole: true });
    number.classList.add("selected");
  }
  updateFindingButtons();
});

function hasWholeSelections() {
  return selections.some(item => item.whole === true);
}

function hasSurfaceSelections() {
  return selections.some(item => item.whole === false);
}

function clearTemporarySelection() {
  all(".surface.selected, .tooth-number.selected, .chart-finding-select.selected, .chart-tooth-label.selected")
  .forEach(element => element.classList.remove("selected"));
}

function isToothMissing(toothNumber) {
  const tooth = query( `.tooth[data-tooth="${toothNumber}"]` );
  return Boolean(tooth && tooth.hidden) || findings.some((record) => record.tooth === toothNumber && record.whole === true && record.finding === "missing");
}

function updateFindingButtons() {
  const surface = hasSurfaceSelections();
  const whole = selections.length > 0 && !surface;
  const setDisabled = (selector, disabled) => {
    all(selector).forEach(button => { button.disabled = disabled; });
  };
  setDisabled(".watch-treatment", !hasWholeSelections() && !surface);
  setDisabled(".surface-treatment", !surface);
  setDisabled(".whole-treatment", !hasWholeSelections());
  setDisabled(".surface-finding", !surface);
  setDisabled(".whole-finding", !whole);
  setDisabled('.finding[data-name="wear"]', !whole && !surface);
  const unmissing = whole && selections.every(item => isToothMissing(item.tooth));
  const missingButton = byId("missingMain");
  missingButton.textContent = unmissing ? "(M) Unmissing" : "(M) Missing";
  missingButton.dataset.name = unmissing ? "unmissing" : "missing";
  syncChartTagSelections();
}
all(".finding").forEach(function(button) {
  button.addEventListener("click", function() {
    if (selections.length === 0) return;
    const finding = this.dataset.name;
    if (finding === "unmissing") {
      delete chartEdits["missing-teeth"];
      const selectedToothNumbers = selections.map((selection) => selection.tooth);
      findings = findings.filter((record) => !( selectedToothNumbers.includes(record.tooth) && record.whole === true && record.finding === "missing" ));
      selectedToothNumbers.forEach(toothNumber => {
        const tooth = query( `.tooth[data-tooth="${toothNumber}"]` );
        if (tooth) tooth.hidden = false;
      });
      finishSelection();
      return;
    }
    if (finding === "missing") delete chartEdits["missing-teeth"];
    const batchId = nextBatchId++;
    if (finding === "Bridge") {
      delete chartEdits["bridge-findings"];
      const selectedTeeth = selections .map((selection) => selection.tooth) .sort((a, b) => a - b);
      if (selectedTeeth.length < 2) {
        alert("Please select at least two teeth for a bridge.");
        return;
      }
      const bridgeStart = selectedTeeth[0];
      const bridgeEnd = selectedTeeth[selectedTeeth.length - 1];
      findings.push({
        tooth: bridgeStart, bridgeTeeth: selectedTeeth, bridgeStart, bridgeEnd, bridgeStartLabel: getToothLabel(bridgeStart), bridgeEndLabel: getToothLabel(bridgeEnd), surfaces: [], whole: true, finding: "Bridge", batchId });
    } else {
      selections.forEach(selection => {
        findings.push({
          tooth: selection.tooth, toothLabel: getToothLabel(selection.tooth), surfaces: [...selection.surfaces], whole: selection.whole, finding, batchId });
      });
    }
    finishSelection();
  });
});
byId("changeAge").addEventListener( "click", () => {
  if (!hasWholeSelections()) {
    alert("Please select one or more tooth numbers first.");
    return;
  }
  selections.forEach(selection => {
    const tooth = query( `.tooth[data-tooth="${selection.tooth}"]` );
    const number = tooth.querySelector(".tooth-number");
    const showPermanent = tooth.hidden || number.dataset.age === "primary";
    setToothAge( selection.tooth, showPermanent ? "permanent" : "primary" );
  });
  clearTemporarySelection();
  selections = [];
  all(".dentition-button").forEach( button => {
    button.classList.remove("active");
    button.setAttribute("aria-pressed", "false");
  });
  refreshChart();
});

function setToothAge(toothNumber, age) {
  const tooth = query( `.tooth[data-tooth="${toothNumber}"]` );
  const number = tooth.querySelector(".tooth-number");
  const primary = age === "primary";
  const letter = primaryToothMap[toothNumber];
  tooth.hidden = primary && !letter;
  number.dataset.age = primary && letter ? "primary" : "permanent";
  number.textContent = "#" + (primary && letter ? letter : toothNumber);
}

function setDentition(mode) {
  clearTemporarySelection();
  selections = [];
  all(".tooth").forEach(tooth => {
    const toothNumber = Number(tooth.dataset.tooth);
    const permanent = mode === "permanent" || ( mode === "mixed" && mixedPermanentTeeth.includes(toothNumber) );
    setToothAge( toothNumber, permanent ? "permanent" : "primary" );
  });
  setDentitionButtons(mode);
  refreshChart();
}
all(".dentition-button").forEach( button => {
  button.addEventListener("click", () => { setDentition(button.dataset.dentition); });
});
all(".treatment").forEach(button => {
  button.addEventListener("click", () => {
    if (button.disabled || selections.length === 0) return;
    const bridgeTeeth = ["Bridge", "bridge"].includes(button.dataset.treatment) ? selections.map(selection => selection.tooth) : null;
    if (bridgeTeeth && bridgeTeeth.length < 2) {
      alert("Please select at least two teeth for a bridge.");
      return;
    }
    const batchId = nextBatchId++;
    selections.forEach(selection => {
      const label = getToothLabel(selection.tooth);
      const record = {
        tooth: selection.tooth, toothLabel: label, ...proximalFillingSurfaces(selection, button.dataset.treatment), whole: selection.whole, finding: button.dataset.treatment, treatment: true, bridgeTeeth, batchId };
      const duplicate = findings.some((r) => r.treatment && r.tooth === record.tooth && r.toothLabel === label && r.finding === record.finding && r.whole === record.whole && [...r.surfaces].sort().join(",") === [...record.surfaces].sort().join(","));
      if (!duplicate) findings.push(record);
      delete chartEdits[ "tooth-" + record.tooth + "-" + label ];
    });
    finishSelection();
  });
});

function getRecordColor(record) {
  const selector = record.treatment ? ".treatment" : ".finding";
  const button = Array.from( all(selector) ).find(button => {
    const name = record.treatment ? button.dataset.treatment : button.dataset.name;
    return name === record.finding;
  });
  return button
  ? getComputedStyle(button).backgroundColor
  : null;
}

function markCrown(toothNumber, color) {
  const tooth = query( `.tooth-diagram[data-tooth="${toothNumber}"]` );
  if (!tooth || !color) return;
  tooth.classList.add("has-crown-outline");
  tooth.querySelector(".crown-outline").style.stroke = color;
}

function renderFindings() {
  all(".tooth").forEach(tooth => { tooth.classList.remove("has-watch-marker"); });
  const surfaceClasses = {
    "stain": "stain", "caries": "caries", "cavity": "caries",
    "decay": "caries", "decalcified": "decalcified", "incipient caries": "incipient-caries",
    "recurrent caries": "recurrent-caries", "gross caries": "gross-caries", "composite": "composite",
    "amalgam": "amalgam", "sealant": "sealant", "IRM": "irm",
    "wear": "wear", "abfraction": "abfraction", "erosion": "erosion",
    "crack line": "crack-line", "chipped": "chipped", "broken": "broken",
    "overhang": "overhang", "open margin": "open-margin", "rest seat": "rest-seat"
  };
  const wholeClasses = {
    "SSC": "ssc", "Zirconia crown": "zirconia-crown", "PFM crown": "pfm-crown",
    "Metal crown": "metal-crown", "RCT": "rct", "post & core": "post-core",
    "implant": "implant", "missing": "missing", "root tip": "root-tip",
    "PARL": "parl", "PARO": "paro", "ankylosis": "ankylosis"
  };
  const crownFindings = [ "SSC", "Zirconia crown", "PFM crown", "Metal crown", "implant" ];
  const crownTreatments = [ "CBU", "SSC", "Zirconia", "PFM", "Metal", "Bridge", "bridge", "Implant", "implant" ];
  const fillingTreatments = [ "Composite", "Amalgam", "RMGI", "IRM" ];
  all(".cervical-label").forEach( label => { label.textContent = "C"; });
  all(".root-markers").forEach( marker => { marker.innerHTML = ""; });
  all(".surface").forEach( surface => {
    surface.classList.remove( ...new Set(Object.values(surfaceClasses)) );
    surface.style.removeProperty("fill");
  });
  all(".tooth-diagram").forEach( tooth => {
    tooth.classList.remove( ...Object.values(wholeClasses), "bridge", "extraction-planned", "has-crown-outline", "has-implant-symbol", "has-endo-symbol", "has-lengthening-arrows", "has-pulpotomy-symbol", "has-post-core-symbol", "has-endo-coronal" );
    tooth.style.removeProperty("--endo-color");
    tooth.querySelector(".crown-outline") .style.removeProperty("stroke");
  });
  findings.forEach(record => {
    const color = getRecordColor(record);
    const tooth = query( `.tooth-diagram[data-tooth="${record.tooth}"]` );
    if (!tooth) return;
    if ( ["Pulpotomy", "RCT", "post & core"].includes(record.finding) ) {
      tooth.classList.add("has-endo-coronal");
      tooth.style.setProperty( "--endo-color", color || "#66bb6a" );
    }
    if (record.finding === "RCT") tooth.classList.add("has-endo-symbol");
    if (record.finding === "Pulpotomy") tooth.classList.add("has-pulpotomy-symbol");
    if (record.finding === "post & core") tooth.classList.add("has-post-core-symbol");
    if ( record.treatment && record.finding === "Crown lengthening" ) tooth.classList.add("has-lengthening-arrows");
    if (record.treatment) {
      if (record.finding === "Watch" && record.whole) tooth.closest(".tooth") .classList.add("has-watch-marker");
      if (record.finding === "Extraction") tooth.classList.add("extraction-planned");
      if (["Implant", "implant"].includes(record.finding)) tooth.classList.add("has-implant-symbol");
      if (crownTreatments.includes(record.finding)) markCrown(record.tooth, color);
      if (fillingTreatments.includes(record.finding) && color) {
        record.surfaces.forEach(name => {
          const surface = tooth.querySelector( `.surface[data-surface="${name}"]` );
          if (surface) surface.style.fill = color;
        });
      }
      return;
    }
    if (record.whole) {
      if (positionFindings.includes(record.finding)) return;
      if ( record.finding === "Bridge" && record.bridgeTeeth ) {
        record.bridgeTeeth.forEach(number => { markCrown(number, color); });
        return;
      }
      if ( ["PARL", "PARO", "ankylosis"].includes(record.finding) ) {
        const markers = query( `.root-markers[data-tooth="${record.tooth}"]` );
        const alreadyPresent = Array.from( markers.children ).some((dot) => dot.dataset.finding === record.finding);
        if (!alreadyPresent) {
          const dot = document.createElement("span");
          dot.className = "root-marker";
          dot.dataset.finding = record.finding;
          dot.style.backgroundColor = color;
          dot.title = record.finding;
          dot.setAttribute("aria-label", record.finding);
          markers.appendChild(dot);
        }
        return;
      }
      if (record.finding === "implant") tooth.classList.add("has-implant-symbol");
      if (crownFindings.includes(record.finding)) markCrown(record.tooth, color);
      if (wholeClasses[record.finding]) tooth.classList.add(wholeClasses[record.finding]);
      if (record.finding === "root tip") tooth.querySelector(".cervical-label").textContent = "R";
      return;
    }
    record.surfaces.forEach(name => {
      const surface = tooth.querySelector( `.surface[data-surface="${name}"]` );
      if (!surface) return;
      if (surfaceClasses[record.finding]) surface.classList.add(surfaceClasses[record.finding]);
      if ( ["composite", "amalgam", "sealant", "IRM"] .includes(record.finding) && color ) surface.style.fill = color;
    });
  });
  renderToothFindingsText();
  renderPositions();
  renderBridges();
}

function renderToothFindingsText() {
  all(".tooth-findings-text").forEach(container => container.replaceChildren());
  findings.forEach(record => {
    if (!record.treatment && record.finding === "missing") return;
    const surfaces = record.whole ? "" : formatSurfaceText(record.surfaces, "cer");
    const name = record.finding === "recurrent caries" ? "recur. caries" : record.finding;
    const description = formatFindingText(surfaces, name);
    const text = record.treatment ? "[" + description + "]" : description;
    (record.treatment ? [record.tooth] : record.bridgeTeeth || [record.tooth]).forEach(number => {
      const container = query(`.tooth-findings-text[data-tooth="${number}"]`);
      if (!container) return;
      const line = document.createElement("div");
      line.className = "tooth-finding-text-line";
      if (record.treatment) line.classList.add("tooth-treatment-line");
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "tooth-finding-action";
      remove.textContent = record.finding === "NSF" ? "✓" : record.finding === "super-eruption" ? "↓↓↓" : text;
      if (record.finding === "NSF") {
        remove.classList.add("nsf-check");
        remove.title = "No significant finding";
      }
      if (record.finding === "super-eruption") {
        remove.classList.add("super-eruption-arrow");
        line.classList.add("super-eruption-line");
        remove.title = "Super-eruption";
      }
      remove.setAttribute("aria-label", `Delete ${text} from tooth ${getToothLabel(number)}`);
      remove.addEventListener("click", event => {
        event.stopPropagation();
        if (!window.confirm(`Delete "${text}" from tooth ${getToothLabel(number)}?`)) return;
        findings = findings.filter(item => item !== record);
        if (!record.treatment && ["Bridge", "bridge"].includes(record.finding)) delete chartEdits["bridge-findings"];
        if (record.treatment && ["Bridge", "bridge"].includes(record.finding)) {
          findings.filter(item => item.treatment && item.batchId === record.batchId &&
            ["Bridge", "bridge"].includes(item.finding)).forEach(item => {
            item.bridgeTeeth = (item.bridgeTeeth || [item.tooth]).filter(number => number !== record.tooth);
          });
        }
        delete chartEdits[record.chartTagId];
        delete chartEdits[`tooth-${record.tooth}|${record.toothLabel || getToothLabel(record.tooth)}`];
        if (record.finding === "missing") delete chartEdits["missing-teeth"];
        refreshChart();
      });
      line.append(remove);
      if (record.finding === "super-eruption") container.prepend(line);
      else container.appendChild(line);
    });
  });
}

function renderPositions() {
  all(".position-display").forEach( display => { display.innerHTML = ""; });
  all(".tooth-number").forEach( number => { number.classList.remove("has-mobility"); });
  findings.forEach(record => {
    if (!positionFindings.includes(record.finding)) return;
    const display = query( `.position-display[data-tooth="${record.tooth}"]` );
    if (!display) return;
    const item = document.createElement("span");
    item.className = "position-item";
    item.textContent = record.finding.charAt(0).toUpperCase() + record.finding.slice(1);
    display.appendChild(item);
    if (record.finding === "mobility") {
      const toothNumber = query( `.tooth-number[data-tooth="${record.tooth}"]` );
      if (toothNumber) toothNumber.classList.add("has-mobility");
    }
  });
}

function renderBridges() {
  all(".bridge-overlay").forEach( overlay => { overlay.remove(); });
  const bridgeGroups = new Map();
  findings.filter((record) => ["Bridge", "bridge"].includes(record.finding)).forEach(record => {
    const key = (record.treatment ? "treatment-" : "finding-") + record.batchId;
    if (!bridgeGroups.has(key)) {
      bridgeGroups.set(key, {
        record, teeth: new Set() });
    }
    (record.bridgeTeeth || [record.tooth]).forEach( number => { bridgeGroups.get(key).teeth.add(number); });
  });
  const ns = "http://www.w3.org/2000/svg";
  all(".arch").forEach(arch => {
    const bounds = arch.getBoundingClientRect();
    const overlay = document.createElementNS(ns, "svg");
    overlay.classList.add("bridge-overlay");
    overlay.setAttribute("width", arch.scrollWidth);
    overlay.setAttribute("height", arch.clientHeight);
    overlay.setAttribute("aria-hidden", "true");
    bridgeGroups.forEach(group => {
      const color = getRecordColor(group.record) || "#ffa726";
      const teeth = [...group.teeth] .map(number => {
        const card = arch.querySelector( `.tooth[data-tooth="${number}"]` );
        if (!card) return null;
        const diagram = card.querySelector(".tooth-diagram");
        const box = diagram.getBoundingClientRect();
        const scale = box.width / 120;
        const pontic = isToothMissing(number);
        if (!pontic) markCrown(number, color);
        return {
          x: box.left - bounds.left + arch.scrollLeft + box.width / 2, y: box.top - bounds.top + arch.scrollTop + 60 * scale, edge: pontic ? 5 : 54 * scale, pontic };
      }) .filter(Boolean) .sort((a, b) => a.x - b.x);
      if (teeth.length < 2) return;
      for (let index = 0; index < teeth.length - 1; index++) {
        const left = teeth[index];
        const right = teeth[index + 1];
        const line = document.createElementNS(ns, "line");
        setAttributes(line, {
          x1: left.x + left.edge, y1: left.y, x2: right.x - right.edge, y2: right.y, stroke: color, "stroke-width": "3", "stroke-linecap": "round" });
        overlay.appendChild(line);
      }
      teeth.filter((tooth) => tooth.pontic).forEach(tooth => {
        const circle = document.createElementNS(ns, "circle");
        setAttributes(circle, { cx: tooth.x, cy: tooth.y, r: "5", fill: color });
        overlay.appendChild(circle);
      });
    });
    arch.appendChild(overlay);
  });
}
let bridgeResizeFrame;
window.addEventListener("resize", () => {
  cancelAnimationFrame(bridgeResizeFrame);
  bridgeResizeFrame = requestAnimationFrame(renderBridges);
});

function bridgeLabel(label) {
  return typeof label === "string" && label.startsWith("#") ? label.slice(1) : label;
}

function formatSurfaceText(surfaces, cervicalLabel = "cervical") {
  const order = ["M", "O", "I", "D", "B", "F", "L", "C"];
  const sorted = [...surfaces].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const text = sorted.filter(surface => surface !== "C").join("");
  return sorted.includes("C") ? (text ? text + (cervicalLabel === "cer" ? "-" : " ") + cervicalLabel : cervicalLabel) : text;
}

function highlightMobility(element) {
  const originalText = element.textContent;
  element.textContent = "";
  const appendText = (parent, value) => {
    value.split(/(mobility)/gi).forEach(part => {
      if (part.toLowerCase() === "mobility") {
        const mobility = document.createElement("span");
        mobility.className = "chart-mobility";
        mobility.textContent = part;
        parent.appendChild(mobility);
      } else {
        parent.appendChild(document.createTextNode(part));
      }
    });
  };
  originalText.split(/(\[[^\]]*\])/g).forEach(part => {
    if (part.startsWith("[") && part.endsWith("]")) {
      const treatment = document.createElement("strong");
      treatment.style.fontWeight = "700";
      appendText(treatment, part);
      element.appendChild(treatment);
    } else {
      appendText(element, part);
    }
  });
}

function formatChartRecord(record) {
  const text = recordText(record);
  return record.treatment ? "[" + text + "]" : text;
}

function formatTreatmentRecord(record) {
  if (["Bridge", "bridge"].includes(record.finding)) return isToothMissing(record.tooth) ? "Fpd pontic" : "Fpd abutment";
  if (record.proximalDecayTreatment && !record.whole) {
    const surface = formatSurfaceText(record.surfaces).replace(/^OD/, "DO");
    return formatFindingText(surface, record.finding);
  }
  return recordText(record);
}

function proximalFillingSurfaces(selection, treatment) {
  const surfaces = [...selection.surfaces];
  const caries = ["decay", "caries", "cavity", "incipient caries", "recurrent caries", "gross caries"];
  const proximalDecayTreatment = !selection.whole && ["Composite", "Amalgam"].includes(treatment) &&
    (selection.chartFindings || []).some(record => caries.includes(record.finding) &&
      record.surfaces.some(surface => ["M", "D"].includes(surface) && surfaces.includes(surface)));
  if (proximalDecayTreatment) {
    const extension = anteriorTeeth.includes(selection.tooth) ? "L" : "O";
    if (!surfaces.includes(extension)) surfaces.push(extension);
  }
  return { surfaces, proximalDecayTreatment };
}

// Chart tags keep deletion controls out of copied text and notifications.
function chartLineText(element) {
  return element.dataset.copyText ?? element.textContent;
}

function syncChartTagSelections() {
  all(".chart-tooth-label").forEach(button => {
    const selected = selections.some(item => item.whole && item.tooth === Number(button.dataset.tooth));
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  all(".chart-finding-select").forEach(button => {
    const surfaces = JSON.parse(button.dataset.surfaces);
    const whole = button.dataset.whole === "true";
    const selected = selections.some(item => item.tooth === Number(button.dataset.tooth) &&
      item.whole === whole && (whole || (surfaces.length && surfaces.every(surface => item.surfaces.includes(surface)))));
    button.classList.toggle("selected", !!selected);
    button.setAttribute("aria-pressed", String(!!selected));
  });
}

function selectChartTarget(tooth, whole, surfaces = [], finding = null) {
  if ((whole && hasSurfaceSelections()) || (!whole && hasWholeSelections())) selections = [];
  let selected = selections.find(item => item.tooth === tooth && item.whole === whole);
  if (whole) {
    if (selected) selections = selections.filter(item => item !== selected);
    else selections.push({ tooth, surfaces: [], whole: true });
  } else if (surfaces.length) {
    if (!selected) {
      selected = { tooth, surfaces: [], whole: false };
      selections.push(selected);
    }
    const deselect = surfaces.every(surface => selected.surfaces.includes(surface));
    if (deselect) {
      selected.surfaces = selected.surfaces.filter(surface => !surfaces.includes(surface));
      selected.chartFindings = (selected.chartFindings || []).filter(item => item.id !== finding?.chartTagId);
    } else {
      selected.surfaces = [...new Set([...selected.surfaces, ...surfaces])];
      if (finding) {
        selected.chartFindings = [...(selected.chartFindings || []), {
          id: finding.chartTagId, finding: finding.finding, surfaces: [...finding.surfaces]
        }];
      }
    }
    if (!selected.surfaces.length) selections = selections.filter(item => item !== selected);
  }
  clearTemporarySelection();
  selections.forEach(item => {
    if (item.whole) query(`.tooth-number[data-tooth="${item.tooth}"]`)?.classList.add("selected");
    else item.surfaces.forEach(surface => {
      query(`.tooth-diagram[data-tooth="${item.tooth}"] .surface[data-surface="${surface}"]`)?.classList.add("selected");
    });
  });
  updateFindingButtons();
}

function createTagChartLine(group) {
  const entry = document.createElement("div");
  entry.className = "chart-entry chart-tag-entry";
  const line = document.createElement("div");
  line.className = "chart-text chart-tag-list";
  const label = document.createElement("button");
  label.type = "button";
  label.contentEditable = "false";
  label.className = "chart-tooth-label chart-tag";
  label.dataset.tooth = group.tooth;
  label.textContent = group.label;
  label.setAttribute("aria-label", "Select tooth " + group.label);
  label.addEventListener("click", () => selectChartTarget(group.tooth, true));
  line.append(label, document.createTextNode(":"));
  const editKey = "tooth-" + group.tooth + "-" + group.label;
  const ordered = [...group.records].sort((a, b) => Number(!!a.treatment) - Number(!!b.treatment));
  const treatmentRecords = ordered.filter(record => record.treatment);
  const parts = [];
  const cleanText = value => value.replace(/\u200b/g, "");
  const syncText = () => {
    line.dataset.copyText = group.label + ":" + parts.map(part =>
      part.gap ? cleanText(part.element.textContent) :
      (part.record.treatment ? (part.record === treatmentRecords[0] ? "[" : "") + part.element.textContent + (part.record === treatmentRecords.at(-1) ? "]" : "") : part.element.textContent)
    ).join("");
  };
  const createGap = (key, fallback) => {
    const gap = document.createElement("span");
    gap.className = "chart-inline-text";
    gap.contentEditable = "true";
    gap.spellcheck = true;
    gap.setAttribute("role", "textbox");
    gap.setAttribute("aria-label", "Text between tags for " + group.label);
    gap.textContent = chartEdits[key] ?? fallback;
    const saveText = () => {
      chartEdits[key] = cleanText(gap.textContent);
      delete chartEdits[editKey];
      syncText();
    };
    gap.addEventListener("input", saveText);
    gap.addEventListener("blur", () => {
      saveText();
      saveOdontogram();
    });
    parts.push({ gap: true, element: gap });
    line.append(gap);
    return gap;
  };

  ordered.forEach((record, index) => {
    // IDs are saved with the chart so individual tag edits survive a reload.
    if (!record.chartTagId) {
      let id;
      do { id = "chart-tag-" + nextChartTagId++; }
      while (findings.some(item => item.chartTagId === id));
      record.chartTagId = id;
    }
    createGap(editKey + "-gap-before-" + record.chartTagId,
      index === 0 || record === treatmentRecords[0] ? " " : "; ");
    const tag = document.createElement("span");
    tag.className = "chart-tag" + (record.treatment ? " chart-treatment-tag" : "");
    const text = document.createElement("span");
    text.className = "chart-tag-text" + (record.treatment ? "" : " chart-finding-select");
    text.contentEditable = record.treatment ? "true" : "false";
    if (record.treatment) {
      text.tabIndex = 0;
      text.addEventListener("pointerdown", () => text.focus({ preventScroll: true }));
    }
    text.spellcheck = true;
    text.setAttribute("role", "textbox");
    text.setAttribute("aria-label", "Edit " + recordText(record) + " on " + group.label);
    if (!record.treatment) {
      text.dataset.tooth = record.tooth;
      text.dataset.whole = String(record.whole);
      text.dataset.surfaces = JSON.stringify(record.surfaces);
      text.setAttribute("role", "button");
      text.setAttribute("aria-label", "Select " + recordText(record) + " on " + group.label);
      text.tabIndex = 0;
      text.title = "Select this finding";
      const selectFinding = () => selectChartTarget(record.tooth, record.whole, record.surfaces, record);
      text.addEventListener("click", selectFinding);
      text.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectFinding(); }
      });
    }
    const defaultText = !record.treatment && ["Bridge", "bridge"].includes(record.finding)
      ? "Bridge (" + (record.bridgeTeeth || [record.tooth]).map(getToothLabel).join("–") + ")"
      : record.treatment ? formatTreatmentRecord(record) : recordText(record);
    text.textContent = capitalizeClinicalAbbreviations(chartEdits[record.chartTagId] ?? defaultText);
    highlightMobility(text);
    const saveRecordText = () => {
      chartEdits[record.chartTagId] = cleanText(text.textContent);
      delete chartEdits[editKey];
      syncText();
    };
    text.addEventListener("input", saveRecordText);
    text.addEventListener("blur", () => { saveRecordText(); saveOdontogram(); });
    parts.push({ record, element: text });
    if (record.treatment) {
      const treatment = document.createElement("strong");
      treatment.style.fontWeight = "700";
      if (record === treatmentRecords[0]) treatment.append(document.createTextNode("["));
      treatment.append(text);
      if (record === treatmentRecords.at(-1)) treatment.append(document.createTextNode("]"));
      tag.append(treatment);
    } else tag.append(text);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-chart-tag";
    remove.textContent = "×";
    remove.title = "Delete " + defaultText + " from " + group.label;
    remove.setAttribute("aria-label", remove.title);
    remove.addEventListener("click", () => {
      // Preserve text beside a deleted tag by carrying it to the next gap.
      const gapKey = editKey + "-gap-before-" + record.chartTagId;
      const next = ordered[ordered.indexOf(record) + 1];
      const nextKey = next ? editKey + "-gap-before-" + next.chartTagId : editKey + "-notes";
      if (chartEdits[gapKey]?.trim()) {
        chartEdits[nextKey] = chartEdits[gapKey] + (chartEdits[nextKey] ?? " ");
      }
      delete chartEdits[gapKey];
      findings = findings.filter(item => item !== record);
      if (record.treatment && ["Bridge", "bridge"].includes(record.finding)) {
        findings.filter(item => item.treatment && item.batchId === record.batchId &&
          ["Bridge", "bridge"].includes(item.finding)).forEach(item => {
          item.bridgeTeeth = (item.bridgeTeeth || [item.tooth])
            .filter(number => number !== record.tooth);
        });
      }
      delete chartEdits[record.chartTagId];
      delete chartEdits[editKey];
      delete chartEdits["missing-teeth"];
      refreshChart();
    });
    tag.append(remove);
    line.append(tag);
  });
  entry.append(line);

  // The trailing space is part of the line, without a separate notes field.
  const trailingText = createGap(editKey + "-notes", chartEdits[editKey] ?? " ");
  line.addEventListener("click", event => {
    if (event.target !== line) return;
    trailingText.focus();
    const range = document.createRange();
    range.selectNodeContents(trailingText);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  });
  syncText();
  return entry;
}

function createChartLine(editKey, defaultText, removeRecords) {
  const entry = document.createElement("div");
  entry.className = "chart-entry";
  const text = document.createElement("span");
  text.className = "chart-text";
  text.contentEditable = "true";
  text.spellcheck = true;
  text.textContent = chartEdits[editKey] ?? defaultText;
  highlightMobility(text);
  text.addEventListener("input", () => { chartEdits[editKey] = text.textContent; });
  text.addEventListener("blur", () => {
    chartEdits[editKey] = text.textContent;
    highlightMobility(text);
  });
  const button = document.createElement("button");
  button.className = "delete-chart-line";
  button.textContent = "×";
  button.title = "Delete this Note line";
  button.addEventListener("click", () => {
    removeRecords();
    delete chartEdits[editKey];
    refreshChart();
  });
  entry.append(text, button);
  return entry;
}

function renderBridgeChart(output) {
  const groups = new Map();
  findings.filter((record) => !record.treatment && ["Bridge", "bridge"].includes(record.finding)).forEach(record => {
    const key = (record.treatment ? "treatment-" : "finding-") + record.batchId;
    if (!groups.has(key)) {
      groups.set(key, {
        records: [], teeth: new Set() });
    }
    const group = groups.get(key);
    group.records.push(record);
    (record.bridgeTeeth || [record.tooth]).forEach( number => { group.teeth.add(number); });
  });
  const descriptions = [];
  const bridgeRecords = [];
  groups.forEach(group => {
    const teeth = [...group.teeth].sort((a, b) => a - b);
    if (teeth.length < 2) return;
    const labels = teeth.map(number => {
      const record = group.records.find(item => item.tooth === number);
      const bridge = group.records.find(item => item.bridgeStart === number || item.bridgeEnd === number);
      return record?.toothLabel || (bridge?.bridgeStart === number ? bridge.bridgeStartLabel : bridge?.bridgeEndLabel) || getToothLabel(number);
    });
    const text = "Bridge (#" + labels.map(label => String(label).replace(/^#+/, "")).join("-") + ")";
    descriptions.push(text);
    bridgeRecords.push(...group.records);
  });
  if (descriptions.length) {
    output.appendChild(createChartLine("bridge-findings", descriptions.join(", "), () => {
      findings = findings.filter(record => !bridgeRecords.includes(record));
    }));
  }
}

function renderChart() {
  const output = byId("output");
  output.innerHTML = "";
  const appointment = document.createElement('div'); appointment.className = 'chart-entry appointment-note-entry';
  const appointmentText = document.createElement('span'); appointmentText.className = 'chart-text appointment-narrative';
  const appointmentTitle = document.createElement('strong'); appointmentTitle.textContent = 'Appointment for:';
  const recall = byId('recallType').value;
  const meet = byId('meetAndGreet').checked;
  appointmentText.append(appointmentTitle, ' '+[recall, meet ? 'Meet and Greet' : ''].filter(Boolean).join('. ')+(recall || meet ? '.' : ''));
  appointment.append(appointmentText); output.append(appointment);
  const blank = document.createElement('div'); blank.className = 'note-blank-line';
  const blankText = document.createElement('span'); blankText.className = 'chart-text note-blank-text'; blankText.append(document.createElement('br'));
  blank.append(blankText); output.append(blank);

  const noteHeading = (label, level = 'section') => {
    const entry = document.createElement('div'); entry.className = 'note-heading note-'+level+'-heading';
    const text = document.createElement('span'); text.className = 'chart-text note-heading-text';
    const title = document.createElement('strong'); title.textContent = label+':';
    text.append(title);
    if (label === 'Clinical and radiographic findings') text.append(' with [suggested treatment]');
    entry.append(text); output.append(entry);
  };
  const cleaningOnly = ['TPP and Prophy','Only prophy'].includes(byId('recallType').value);
  noteHeading('COHRI');
  const cohri = readRecallCOHRI();
  const cohriLines = [];
  const vitals = [cohri.vitals.bp.trim() ? 'BP: '+cohri.vitals.bp.trim()+' mmHg' : '',
    cohri.vitals.pulse.trim() ? 'Pulse: '+cohri.vitals.pulse.trim()+' bpm' : '',
    cohri.vitals.temperature.trim() ? 'Temperature: '+cohri.vitals.temperature.trim()+' °F' : ''].filter(Boolean);
  cohriLines.push(['Vitals', vitals.join('. ')]);
  [['history', 'Update medical and dental history'], ['medication', 'Update medication'], ['premedication', 'Premedication']].forEach(([key, label]) => {
    const item = cohri.review[key];
    if (!item.choice) return;
    const value = item.choice === 'no-change' ? 'No change' : item.choice === 'none' ? 'None'
      : (key === 'premedication' ? 'Yes' : 'Change') + (item.details.trim() ? ' '+item.details.trim() : '');
    cohriLines.push([label, value]);
  });
  cohriLines.forEach(([label, value]) => {
    const entry = document.createElement('div'); entry.className = 'chart-entry cohri-note-entry';
    const text = document.createElement('span'); text.className = 'chart-text cohri-narrative';
    const title = document.createElement('strong'); title.textContent = label+':';
    text.append(title, ' '+value+(!value || value.endsWith('.') ? '' : '.'));
    entry.append(text); output.append(entry);
  });
  const extraOralText = extraOralExamText({extraOralStructured: readExtraOralExam(), extraOralExam: byId('extraOralExam').value});
  if (!cleaningOnly && extraOralText) {
    noteHeading('Extra-oral screening');
    const entry = document.createElement('div'); entry.className = 'chart-entry extra-oral-note-paragraph note-subsection-content';
    const text = document.createElement('span'); text.className = 'chart-text extra-oral-narrative';
    const extraOralData = readExtraOralExam();
    let hasGroup = false;
    for (const group of ['TMJ', 'Head and neck']) {
      const selected = extraOralFields.filter(([key, , category]) => category === group && ['yes','no'].includes(extraOralData[key]?.choice));
      if (!selected.length) continue;
      if (hasGroup) text.append(document.createElement('br'));
      const groupTitle = document.createElement('strong');
      groupTitle.textContent = (group === 'Head and neck' ? 'Head and neck' : 'TMJ')+':';
      text.append(groupTitle, ' ');
      selected.forEach(([key, label], index) => {
        if (index) text.append(' ');
        const item = extraOralData[key];
        if (item.choice === 'yes') {
          const sentence = document.createElement('strong');
          const details = item.details.trim();
          sentence.textContent = label+':'+(details ? ' '+details+(details.endsWith('.') ? '' : '.') : '');
          text.append(sentence);
        } else text.append('No '+label.charAt(0).toLowerCase()+label.slice(1)+'.');
      });
      hasGroup = true;
    }
    const additional = byId('extraOralExam').value.trim();
    if (additional) {
      if (hasGroup) text.append(document.createElement('br'));
      text.append(additional);
    }
    entry.append(text); output.append(entry);
  }
  const evaluationTitle = byId('recallEvaluationHeading').textContent;
  if (!cleaningOnly && evaluationTitle) {
    noteHeading(evaluationTitle);
  const radiographs = [...all('.recall-radiograph:checked')].map(input => input.value === 'specific PAs' && byId('specificPADetails').value.trim() ? 'specific PAs '+byId('specificPADetails').value.trim() : input.value);
  {
    const entry = document.createElement('div'); entry.className = 'chart-entry note-subsection-entry';
    const text = document.createElement('span'); text.className = 'chart-text';
    text.classList.add('evaluation-narrative');
    const title = document.createElement('strong'); title.textContent = 'Radiograph taken:';
    text.append(title, radiographs.length ? ' '+radiographs.join(', ')+'.' : '');
    entry.append(text); output.append(entry);
  }
  if (byId("updatedPeriodontalCharting").checked) {
    const entry = document.createElement("div"); entry.className = "chart-entry";
    const text = document.createElement("span"); text.className = "chart-text evaluation-narrative";
    const title = document.createElement("strong"); title.textContent = "Updated periodontal charting."; text.append(title);
    entry.append(text); output.append(entry);
  }
  const evaluationLines = recallDentitionOcclusionNote();
  const dentitionText = evaluationLines.filter(value => !value.startsWith('Occlusal classification:')).join(' ');
  const occlusionText = evaluationLines.find(value => value.startsWith('Occlusal classification:'))?.replace(/^Occlusal classification: /, '') || '';
  [['Dentition', dentitionText], ['Occlusal classification', occlusionText]].forEach(([label, value]) => {
    const entry = document.createElement('div'); entry.className = 'chart-entry note-subsection-entry';
    const text = document.createElement('span'); text.className = 'chart-text evaluation-narrative';
    const title = document.createElement('strong'); title.textContent = label+':';
    text.append(title, ' '+value); entry.append(text); output.append(entry);
  });
    renderOralScreeningNote(output);
    noteHeading('Clinical and radiographic findings', 'subsection');
  renderMissingChart(output);
  renderBridgeChart(output);
  const groups = new Map();
  findings.forEach(record => {
    if (!record.treatment && ["missing", "Bridge", "bridge"].includes(record.finding)) return;
    const label = record.toothLabel || getToothLabel(record.tooth);
    const key = record.tooth + "|" + label;
    if (!groups.has(key)) groups.set(key, { tooth: record.tooth, label, records: [] });
    groups.get(key).records.push(record);
  });
  Object.entries(chartEdits).forEach(([key, value]) => {
    const match = key.match(/^tooth-(\d+)-(.+)-notes$/);
    if (!match || !value.trim()) return;
    const tooth = Number(match[1]);
    const label = match[2];
    const groupKey = tooth + "|" + label;
    if (!groups.has(groupKey)) groups.set(groupKey, { tooth, label, records: [] });
  });
  [...groups.values()].sort((a, b) => a.tooth - b.tooth)
    .forEach(group => output.append(createTagChartLine(group)));
  }
  const cleaningParagraphs = cleaningNoteParagraphs();
  if (cleaningParagraphs.length) noteHeading(byId('cleaningHeading').textContent);
  cleaningParagraphs.forEach(paragraph => {
    const entry = document.createElement("div"); entry.className = "chart-entry cleaning-note-entry";
    const text = document.createElement("span"); text.className = "chart-text cleaning-narrative";
    text.textContent = paragraph;
    entry.append(text); output.append(entry);
  });
  renderRecallPreceptorNote(output);
  enableRecallNoteEditing(output);
  syncChartTagSelections();
}

function renderMissingChart(output) {
  const missingRecords = findings.filter((record) => !record.treatment && record.finding === "missing");
  if (missingRecords.length === 0) return;
  const labels = [...new Set( missingRecords.slice() .sort((a, b) => a.tooth - b.tooth) .map((record) => record.toothLabel || getToothLabel(record.tooth)) )];
  const entry = document.createElement("div");
  entry.className = "chart-entry";
  const text = document.createElement("span");
  text.className = "chart-text";
  text.contentEditable = "true";
  text.spellcheck = true;
  text.textContent = chartEdits["missing-teeth"] ?? "Missing #" + labels.map(label => String(label).replace(/^#+/, "")).join(", ");
  text.addEventListener("input", () => { chartEdits["missing-teeth"] = text.textContent; });
  text.addEventListener("blur", () => { chartEdits["missing-teeth"] = text.textContent; });
  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-chart-line";
  deleteButton.textContent = "×";
  deleteButton.title = "Delete all missing-tooth findings";
  deleteButton.addEventListener("click", () => {
    findings = findings.filter((record) => record.finding !== "missing");
    delete chartEdits["missing-teeth"];
    refreshChart();
  });
  entry.appendChild(text);
  entry.appendChild(deleteButton);
  output.appendChild(entry);
}
byId("undo").addEventListener( "click", () => {
  if (findings.length === 0) return;
  const lastBatchId = findings[findings.length - 1].batchId;
  findings = findings.filter((record) => record.batchId !== lastBatchId);
  delete chartEdits["missing-teeth"];
  delete chartEdits["bridge-findings"];
  renderFindings();
  renderChart();
});
byId("copyChart").addEventListener("click", async () => {
  const note = byId("output");
  note.classList.remove("note-copy-blink");
  void note.offsetWidth;
  note.classList.add("note-copy-blink");
  const entries = [...all("#output .chart-text")];
  if (!entries.length) {
    alert("The Note is empty.");
    return;
  }
  const plain = entries.map(chartLineText).join("\n");
  const formatted = document.createElement("div");
  const copyTextStyle = (source, target) => {
    const style = getComputedStyle(source);
    ["fontFamily", "fontSize", "fontWeight", "fontStyle", "color",
      "textDecoration", "lineHeight", "letterSpacing"].forEach(property => {
      target.style[property] = style[property];
    });
  };
  entries.forEach(entry => {
    const line = document.createElement("p");
    line.style.margin = "0";
    if (entry.isContentEditable || entry.matches(".cleaning-narrative, .cohri-narrative, .appointment-narrative, .note-blank-text, .extra-oral-narrative, .evaluation-narrative, .oral-screening-narrative, .note-heading-text")) line.innerHTML = entry.innerHTML;
    else line.textContent = chartLineText(entry);
    copyTextStyle(entry, line);
    if (!entry.isContentEditable && !entry.matches(".cleaning-narrative, .cohri-narrative, .appointment-narrative, .note-blank-text, .extra-oral-narrative, .evaluation-narrative, .oral-screening-narrative, .note-heading-text")) highlightMobility(line);
    const mobilityStyle = entry.querySelector(".chart-mobility");
    if (mobilityStyle) {
      line.querySelectorAll(".chart-mobility").forEach(span => {
        copyTextStyle(mobilityStyle, span);
      });
    }
    formatted.appendChild(line);
  });
  const message = byId("copyMessage");
  try {
    let rich = false;
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      try {
        await navigator.clipboard.write([new ClipboardItem({
          "text/plain": new Blob([plain], { type: "text/plain" }),
          "text/html": new Blob([formatted.innerHTML], { type: "text/html" })
        })]);
        rich = true;
      } catch (error) {
        await navigator.clipboard.writeText(plain);
      }
    } else {
      await navigator.clipboard.writeText(plain);
    }
    message.textContent = rich ? "Chart copied with formatting!" : "Chart copied as plain text.";
    setTimeout(() => { message.textContent = ""; }, 2000);
  } catch (error) {
    message.textContent = "Copy unavailable. Select the Note text and copy it manually.";
  }
});

const findingShortcuts = {
  n: "NSF", d: "decay", c: "composite", a: "amalgam",
  r: "RCT", z: "Zirconia crown", b: "Bridge",
  m: "missingMain", t: "root tip",
  p: "PFM crown", i: "incipient caries"
};
document.addEventListener("keydown", event => {
  if ( event.ctrlKey || event.metaKey || event.altKey || event.repeat || event.isComposing ) return;
  const editingSelector = "input, textarea, select, " + "[contenteditable]:not([contenteditable='false']), " + "[role='textbox']";
  const active = document.activeElement;
  if (active && active.closest(editingSelector)) return;
  if ( event.target instanceof Element && event.target.closest(editingSelector) ) return;
  const treatment = {f: "Composite", e: "Extraction", w: "Watch"}[event.key.toLowerCase()];
  const name = treatment || findingShortcuts[event.key.toLowerCase()];
  if (!name) return;
  const button = treatment ? query(`.treatment[data-treatment="${treatment}"]`) : name === "missingMain" ? byId("missingMain") : Array.from(all(".finding")) .find((button) => button.dataset.name === name);
  if ( !button || button.disabled || button.closest("[hidden]") || selections.length === 0 ) return;
  event.preventDefault();
  button.click();
});

const recallCOHRIGroups = {
  history: {show: 'change', input: 'historyDetails'},
  medication: {show: 'change', input: 'medicationDetails'},
  premedication: {show: 'yes', input: 'premedicationDetails'}
};
function updateRecallCOHRI() {
  Object.entries(recallCOHRIGroups).forEach(([name, group]) => {
    byId(group.input).hidden = query(`input[name="cohri-${name}"]:checked`)?.value !== group.show;
  });
}
function readRecallCOHRI() {
  return {
    vitals: Object.fromEntries([...all('.vitals-input')].map(input => [input.dataset.vital, input.value])),
    review: Object.fromEntries(Object.entries(recallCOHRIGroups).map(([name, group]) => [name, {
      choice: query(`input[name="cohri-${name}"]:checked`)?.value || '', details: byId(group.input).value
    }]))
  };
}
function restoreRecallCOHRI(saved = {}) {
  all('.vitals-input').forEach(input => { input.value = typeof saved.vitals?.[input.dataset.vital] === 'string' ? saved.vitals[input.dataset.vital] : ''; });
  Object.entries(recallCOHRIGroups).forEach(([name, group]) => {
    all(`input[name="cohri-${name}"]`).forEach(input => { input.checked = saved.review?.[name]?.choice ? input.value === saved.review[name].choice : input.defaultChecked; });
    byId(group.input).value = typeof saved.review?.[name]?.details === 'string' ? saved.review[name].details : '';
  });
  updateRecallCOHRI();
}

const odontogramStorageKey = "recall-autosave-v1";
let restoringOdontogram = false;
const autosaveMessage = document.createElement("div");
autosaveMessage.id = "autosaveMessage";
autosaveMessage.setAttribute("role", "status");
byId("copyMessage").after(autosaveMessage);

function saveOdontogram() {
  if (restoringOdontogram) return;
  const data = {
    version: 1,
    noteEdits: recallNoteEdits,
    noteFields: readRecallNoteFields(),
    recallType: byId("recallType").value,
    meetAndGreet: byId("meetAndGreet").checked,
    radiographs: [...all(".recall-radiograph:checked")].map(input => input.value),
    specificPADetails: byId("specificPADetails").value,
    updatedPeriodontalCharting: byId("updatedPeriodontalCharting").checked,
    dentitionOcclusion: readRecallDentitionOcclusion(),
    cohri: readRecallCOHRI(),
    cleaningOptions: readCleaningOptions(),
    oralScreening: readOralScreening(),
    extraOral: {findings: readExtraOralExam(), notes: byId("extraOralExam").value},
    findings,
    nextBatchId,
    chartEdits,
    teeth: Array.from( all(".tooth") ).map(tooth => {
      return {
        number: Number(tooth.dataset.tooth), age: tooth.querySelector(".tooth-number").dataset.age, hidden: tooth.hidden };
    }),
    mode:
    query(".dentition-button.active")
    ?.dataset.dentition || null
  };
  try {
    localStorage.setItem( odontogramStorageKey, JSON.stringify(data) );
    autosaveMessage.textContent = "Saved on this device.";
  } catch (error) {
    autosaveMessage.textContent = "Autosave unavailable. This browser could not save the chart.";
  }
}

function restoreOdontogram() {
  restoringOdontogram = true;
  try {
    const raw = localStorage.getItem(odontogramStorageKey);
    if (!raw) {
      autosaveMessage.textContent = "Autosave ready on this device.";
      return;
    }
    const data = JSON.parse(raw);
    if ( data.version !== 1 || !Array.isArray(data.findings) || !Array.isArray(data.teeth) ) throw new Error("Invalid saved chart");
    const validFindings = data.findings.every((record) => record && Number.isInteger(record.tooth) && record.tooth >= 1 && record.tooth <= 32 && typeof record.finding === "string" && Array.isArray(record.surfaces) && typeof record.whole === "boolean" && Number.isInteger(record.batchId));
    if (!validFindings) throw new Error("Invalid saved findings");
    byId("recallType").value = [...byId("recallType").options].some(option => option.value === data.recallType) ? data.recallType : "";
    byId("meetAndGreet").checked = data.meetAndGreet === true;
    all(".recall-radiograph").forEach(input => { input.checked = Array.isArray(data.radiographs) && data.radiographs.includes(input.value); });
    byId("specificPADetails").value = typeof data.specificPADetails === "string" ? data.specificPADetails : "";
    updateSpecificPAs();
    byId("updatedPeriodontalCharting").checked = data.updatedPeriodontalCharting === true;
    restoreCleaningOptions(data.cleaningOptions);
    restoreRecallDentitionOcclusion(data.dentitionOcclusion);
    restoreRecallCOHRI(data.cohri);
    restoreOralScreening(data.oralScreening);
    restoreExtraOralExam(data.extraOral?.findings);
    byId("extraOralExam").value = typeof data.extraOral?.notes === "string" ? data.extraOral.notes : "";
    restoreRecallNoteFields(data.noteFields);
    recallNoteEdits = Object.fromEntries(Object.entries(data.noteEdits || {}).filter(([,value]) => typeof value === "string"));
    findings = data.findings;
    chartEdits = Object.fromEntries( Object.entries(data.chartEdits || {}) .filter((entry) => typeof entry[1] === "string") );
    nextBatchId = Math.max( Number(data.nextBatchId) || 1, 1 + findings.reduce((max, record) => Math.max(max, record.batchId), 0) );
    data.teeth.forEach(saved => {
      if ( !Number.isInteger(saved.number) || saved.number < 1 || saved.number > 32 ) return;
      setToothAge( saved.number, saved.age === "primary" ? "primary" : "permanent" );
      query( `.tooth[data-tooth="${saved.number}"]` ).hidden = Boolean(saved.hidden);
    });
    setDentitionButtons(data.mode);
    selections = [];
    clearTemporarySelection();
    refreshChart();
    autosaveMessage.textContent = "Saved chart restored.";
  } catch (error) {
    autosaveMessage.textContent = "The saved chart could not be restored. " + "Your stored copy has not been changed.";
  } finally {
    restoringOdontogram = false;
  }
}
const renderChartBeforeAutosave = renderChart;
renderChart = () => {
  renderChartBeforeAutosave();
  saveOdontogram();
};
document.addEventListener("input", event => { if (event.target.closest(".chart-text, .chart-saved-note")) saveOdontogram(); });
document.addEventListener("focusout", event => { if (event.target.closest(".chart-text, .chart-saved-note")) saveOdontogram(); });
window.addEventListener("pagehide", saveOdontogram);

restoreOdontogram();
const clearAllDialog = byId("clearAllDialog");
byId("clearAll").addEventListener( "click", () => { clearAllDialog.showModal(); });
byId("cancelClearAll").addEventListener( "click", () => { clearAllDialog.close(); });
byId("confirmClearAll").addEventListener( "click", () => {
  all(".recall-radiograph").forEach(input => { input.checked = false; });
  byId("specificPADetails").value = "";
  updateSpecificPAs();
  byId("updatedPeriodontalCharting").checked = false;
  restoreCleaningOptions();
  restoreRecallDentitionOcclusion();
  restoreRecallCOHRI();
  restoreOralScreening();
  restoreExtraOralExam();
  byId("extraOralExam").value = "";
  byId("recallType").value = "";
  updateRecallEvaluation();
  byId("meetAndGreet").checked = false;
  restoreRecallNoteFields();
  recallNoteEdits = {};
  findings = [];
  chartEdits = {};
  selections = [];
  nextBatchId = 1;
  clearTemporarySelection();
  for (let number = 1; number <= 32; number++) {
    setToothAge(number, "permanent");
  }
  setDentitionButtons("permanent");
  byId("copyMessage").textContent = "";
  refreshChart();
  clearAllDialog.close();
});
all(".finding-section, .treatment-section")
.forEach(section => {
  if (section.querySelector(".category-pair")) return;
  if (section.classList.contains("finding-section")) {
    const findingRows = [...section.children].filter(row => row.classList.contains("finding-row"));
    const rowsByName = Object.fromEntries(findingRows.map(row => [row.classList.contains("nsf-row") ? "NSF" : row.querySelector(".finding-label")?.textContent.trim().replace(/:$/, ""), row]));
    [["NSF", "Caries", "Endo"], ["Material"], ["Non-carious", "Position"]].forEach(names => {
      const line = document.createElement("div");
      line.className = "category-pair recall-findings-line";
      names.forEach(name => { if (rowsByName[name]) line.append(rowsByName[name]); });
      section.append(line);
    });
    return;
  }
  const rows = [...section.children] .filter(row => row.classList.contains("finding-row") && !row.classList.contains("nsf-row"));
  for (let i = 0; i < rows.length; i += 2) {
    const pair = document.createElement("div");
    pair.className = "category-pair";
    rows[i].before(pair);
    pair.append(rows[i]);
    if (rows[i + 1]) pair.append(rows[i + 1]);
  }
});

function alignMidline() {
  const canvas = query(".dentition-canvas");
  const tooth8 = query('#maxillary .tooth-diagram[data-tooth="8"]');
  const tooth9 = query('#maxillary .tooth-diagram[data-tooth="9"]');
  if (!canvas || !tooth8 || !tooth9) return;
  const midpoint = ( tooth8.getBoundingClientRect().right + tooth9.getBoundingClientRect().left ) / 2;
  canvas.style.setProperty( "--tooth-midline", `${midpoint - canvas.getBoundingClientRect().left}px` );
}
requestAnimationFrame(alignMidline);
window.addEventListener("resize", alignMidline);
const odontogram = query(".odontogram-grid");
const treatments = query(".treatment-section");
const treatmentPanel = treatments?.closest(".clinical-panel");
if (odontogram && treatmentPanel) {
  const oldWrapper = treatmentPanel.parentElement;
  const divider = document.createElement("hr");
  divider.className = "treatment-divider";
  treatmentPanel.classList.add("odontogram-treatments");
  odontogram.append(divider, treatmentPanel);
  if ( oldWrapper.classList.contains("clinical-panels") && !oldWrapper.children.length ) oldWrapper.remove();
}
// Show the last applied action above #8/#9 and allow it to be undone.
(() => {
  const canvas = document.querySelector(".dentition-canvas");
  if (!canvas) return;

  const style = document.createElement("style");
  style.textContent = `
    .dentition-canvas.has-action-notice { padding-top: 44px; }
    .odontogram-action-notice {
      position: absolute;
      top: 0;
      left: var(--tooth-midline, 50%);
      transform: translateX(-50%);
      z-index: 12;
      display: flex;
      align-items: center;
      gap: 10px;
      width: max-content;
      max-width: calc(100% - 24px);
      box-sizing: border-box;
      padding: 3px 8px;
      border: 1px solid rgba(118, 145, 175, .3);
      border-radius: 12px;
      background: rgba(255, 249, 214, .92);
      backdrop-filter: blur(14px);
      box-shadow: 0 3px 12px rgba(30, 60, 100, .1);
      color: #203653;
      font: 12px/1.2 Arial, sans-serif;
    }
    .odontogram-action-notice[hidden] { display: none; }
    .odontogram-action-text {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .odontogram-action-undo {
      flex: none;
      padding: 3px 8px;
      border: 1px solid rgba(118, 145, 175, .4);
      border-radius: 8px;
      background: rgba(255, 255, 255, .8);
      color: #203653;
      font: bold 11px/1.2 Arial, sans-serif;
      cursor: pointer;
    }
    .odontogram-action-undo:hover { background: #fff; }
    .odontogram-action-undo:disabled { opacity: .45; cursor: default; }
    @media (max-width: 640px) {
      .dentition-canvas.has-action-notice { padding-top: 76px; }
      .odontogram-action-notice { top: 0; }
    }
  `;
  document.head.append(style);

  const notice = document.createElement("div");
  notice.className = "odontogram-action-notice";
  notice.hidden = true;
  const text = document.createElement("span");
  text.className = "odontogram-action-text";
  text.setAttribute("role", "status");
  text.setAttribute("aria-live", "polite");
  const undo = document.createElement("button");
  undo.type = "button";
  undo.className = "odontogram-action-undo";
  undo.textContent = "Undo";
  undo.title = "Undo this action";
  notice.append(text, undo);
  canvas.append(notice);

  let history = [];
  let pending = null;

  function snapshot() {
    return {
      findings: JSON.parse(JSON.stringify(findings)),
      chartEdits: { ...chartEdits },
      chartLines: [...document.querySelectorAll("#output .chart-text")]
        .map(chartLineText),
      nextBatchId,
      teeth: [...document.querySelectorAll(".tooth")].map(tooth => ({
        number: Number(tooth.dataset.tooth),
        age: tooth.querySelector(".tooth-number").dataset.age,
        hidden: tooth.hidden
      })),
      modes: [...document.querySelectorAll(".dentition-button")]
        .map(button => button.classList.contains("active"))
    };
  }

  function positionNotice() {
    if (notice.hidden) return;
    const bounds = canvas.getBoundingClientRect();
    const center = bounds.left + parseFloat(
      canvas.style.getPropertyValue("--tooth-midline") || bounds.width / 2
    );
    let left = bounds.left + 12;
    let right = bounds.right - 12;
    let toolbarBottom = bounds.top;
    canvas.querySelectorAll(".dentition-controls, .main-odontogram-controls")
      .forEach(controls => {
        const box = controls.getBoundingClientRect();
        toolbarBottom = Math.max(toolbarBottom, box.bottom);
        if (box.left < center) left = Math.max(left, box.right + 8);
        else right = Math.min(right, box.left - 8);
      });
    const room = 2 * Math.min(center - left, right - center);
    // Use the centered space in the toolbar; wrap below it on narrow screens.
    const fits = room >= 120;
    notice.style.top = fits ? "0px" : `${toolbarBottom - bounds.top + 8}px`;
    notice.style.maxWidth = `${fits ? room : bounds.width - 24}px`;
    canvas.style.paddingTop = fits ? "" :
      `${toolbarBottom - bounds.top + notice.offsetHeight + 24}px`;
  }
  window.addEventListener("resize", () => {
    requestAnimationFrame(positionNotice);
  });

  function show(message, canUndo = true) {
    text.textContent = message;
    highlightMobility(text);
    text.title = message;
    undo.disabled = !canUndo;
    notice.hidden = false;
    canvas.classList.add("has-action-notice");
    requestAnimationFrame(() => {
      alignMidline();
      positionNotice();
      renderBridges();
    });
  }

  function reset() {
    history = [];
    pending = null;
    notice.hidden = true;
    canvas.classList.remove("has-action-notice");
    canvas.style.paddingTop = "";
    requestAnimationFrame(() => {
      alignMidline();
      positionNotice();
      renderBridges();
    });
  }

  function undoAction() {
    const action = history.pop();
    if (!action) return;
    const state = action.before;
    findings = state.findings;
    chartEdits = state.chartEdits;
    nextBatchId = state.nextBatchId;
    state.teeth.forEach(saved => {
      setToothAge(saved.number, saved.age);
      document.querySelector(`.tooth[data-tooth="${saved.number}"]`).hidden = saved.hidden;
    });
    document.querySelectorAll(".dentition-button").forEach((button, index) => {
      button.classList.toggle("active", state.modes[index]);
      button.setAttribute("aria-pressed", String(state.modes[index]));
    });
    clearTemporarySelection();
    selections = [];
    refreshChart();
    const previous = history[history.length - 1];
    show(previous ? previous.message : "Undone: " + action.message, !!previous);
  }

  undo.addEventListener("click", undoAction);

  // Capture the state before the existing button handlers apply an action.
  document.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button || button.disabled) return;
    pending = null;
    if (button.id === "undo") {
      if (history.length) {
        event.preventDefault();
        event.stopImmediatePropagation();
        undoAction();
      } else reset();
      return;
    }
    if (button.matches("#confirmClearAll, .delete-chart-line, .delete-chart-tag, .dentition-button")) {
      reset();
      return;
    }
    if (!button.matches("#changeAge, .finding, .treatment")) return;
    if (!selections.length || (button.id === "changeAge" && !hasWholeSelections())) return;
    const name = button.dataset.name || button.dataset.treatment;
    if (["Bridge", "bridge"].includes(name) && selections.length < 2) return;
    pending = {
      button,
      before: snapshot(),
      name,
      selected: selections.map(selection => ({
        ...selection,
        surfaces: [...selection.surfaces],
        label: getToothLabel(selection.tooth)
      }))
    };
  }, true);

  // Existing handlers have now updated the chart; announce successful changes.
  document.addEventListener("click", event => {
    const action = pending;
    pending = null;
    if (!action || event.target.closest("button") !== action.button) return;
    const after = snapshot();
    const content = state => JSON.stringify([state.findings, state.chartEdits, state.teeth]);
    if (content(action.before) === content(after)) return;
    action.message = action.selected.map(selection => {
      if (action.button.id === "changeAge") {
        const tooth = after.teeth.find(item => item.number === selection.tooth);
        return `${selection.label}: ${tooth.age}${tooth.hidden ? " (hidden in primary dentition)" : " → " + getToothLabel(selection.tooth)}`;
      }
      const surface = selection.whole ? "" : formatSurfaceText(selection.surfaces);
      const name = action.name === "unmissing" ? "restored" : action.name;
      const detail = (surface ? surface + " " : "") + name;
      return `${selection.label}: ${action.button.matches(".treatment") ? "[" + detail + "]" : detail}`;
    }).join("; ");
    const changedLines = after.chartLines.filter(line =>
      !action.before.chartLines.includes(line)
    );
    if (changedLines.length) action.message = changedLines.join("; ");
    history.push(action);
    show(action.message);
  });

  // Later manual edits should remain intact when using the original chart Undo.
  document.addEventListener("input", event => {
    if (event.target.closest(".chart-text, .chart-saved-note")) reset();
  });
})();

// Keep Chart and Suggested treatment in separate panels outside the odontogram.
(() => {
  const treatment = document.querySelector(".treatment-section")?.closest(".clinical-panel");
  const output = document.getElementById("output");
  const heading = [...document.querySelectorAll("h2")].find(item => item.textContent.trim() === "Note");
  const grid = document.querySelector(".odontogram-grid");
  if (!treatment || !output || !grid) return;
  const layout = document.createElement("div");
  layout.className = "chart-treatment-layout";
  const chart = document.createElement("section");
  chart.className = "clinical-panel chart-side-panel";
  if (heading) chart.append(heading);
  const noteFields = query(".recall-note-fields");
  if (noteFields) chart.append(noteFields);
  chart.append(output);
  [".chart-controls", "#copyMessage", "#autosaveMessage"]
    .forEach(selector => {
      const element = document.querySelector(selector);
      if (element) chart.append(element);
    });
  document.querySelectorAll(".treatment-divider").forEach(divider => divider.remove());
  treatment.classList.add("sticky-treatment-panel");
  layout.append(chart, treatment);
  grid.after(layout);
})();
// Place the page-wide reset control after all content panels.
const clearAllArea = query(".clear-all-area");
if (clearAllArea) document.body.append(clearAllArea);

byId("output").addEventListener("animationend", event => {
  if (event.animationName === "note-copy-blink") byId("output").classList.remove("note-copy-blink");
});

function updateRecallEvaluation() {
  const type = byId("recallType").value;
  const cleaningOnly = ["TPP and Prophy", "Only prophy"].includes(type);
  query(".extra-oral-exam").hidden = cleaningOnly;
  query(".oral-screening-panel").hidden = cleaningOnly;
  const treatmentPanel = query(".treatment-section")?.closest(".clinical-panel");
  if (treatmentPanel) treatmentPanel.hidden = cleaningOnly;
  query(".chart-treatment-layout")?.classList.toggle("cleaning-only-layout", cleaningOnly);
  const cleaningTitles = {
    "Prophy adult/ POE": "Prophy adult",
    "Prophy child/POE": "Prophy child",
    "Perio maintenance/CPE": "Perio maintenance",
    "TPP and Prophy": "Prophy",
    "Only prophy": "Prophy"
  };
  byId("cleaningHeading").textContent = cleaningTitles[type] || "Cleaning";
  const heading = type === "Perio maintenance/CPE" ? "Comprehensive periodontal evaluation (CPE)"
    : ["Prophy adult/ POE", "Prophy child/POE"].includes(type) ? "Periodic oral evaluation (POE)" : "";
  byId("recallEvaluationHeading").textContent = heading;
  byId("recallEvaluationHeading").hidden = !heading;
  byId("recallEvaluation").hidden = !heading;
  byId("recallEvaluationArea").hidden = !heading;
  if (!heading) clearTemporarySelection();
  else requestAnimationFrame(() => { alignMidline(); renderBridges(); });
}
byId("recallType").addEventListener("change", () => { updateRecallEvaluation(); renderChart(); saveOdontogram(); });
updateRecallEvaluation();

byId("meetAndGreet").addEventListener("change", refreshRecallNote);

all('.cohri-choice').forEach(input => input.addEventListener('change', () => {
  updateRecallCOHRI();
  renderChart();
  const group = recallCOHRIGroups[input.name.slice(6)];
  if (group && input.value === group.show) byId(group.input).focus();
  saveOdontogram();
}));
all('.vitals-input, .cohri-panel .cohri-details').forEach(input => input.addEventListener('input', refreshRecallNote));
updateRecallCOHRI();

all('.oral-screening-choice').forEach(input => input.addEventListener('change', () => {
  updateOralScreening();
  if (input.value === 'yes') byId(input.getAttribute('aria-controls')).focus();
  renderChart();
  saveOdontogram();
}));
all('.oral-screening-detail').forEach(input => input.addEventListener('input', refreshRecallNote));
byId('mallampatiScore').addEventListener('change', refreshRecallNote);
updateOralScreening();

all('.eo-choice').forEach(input => input.addEventListener('change', () => {
  updateExtraOralFields();
  if (input.value === 'yes') byId(input.getAttribute('aria-controls')).focus();
  renderChart(); saveOdontogram();
}));
all('.extra-oral-details, #extraOralExam').forEach(input => input.addEventListener('input', refreshRecallNote));
updateExtraOralFields();

function updateSpecificPAs() {
  byId("specificPADetails").hidden = !byId("specificPAs").checked;
}
all(".recall-radiograph").forEach(input => input.addEventListener("change", () => {
  updateSpecificPAs();
  if (input.id === "specificPAs" && input.checked) byId("specificPADetails").focus();
  renderChart(); saveOdontogram();
}));
byId("specificPADetails").addEventListener("input", refreshRecallNote);
updateSpecificPAs();

all(".cleaning-choice, .cleaning-floss-choice").forEach(input => input.addEventListener("change", refreshRecallNote));

byId("oralScreeningAdditional").addEventListener("input", refreshRecallNote);

byId("updatedPeriodontalCharting").addEventListener("change", refreshRecallNote);

all('.rx-dentition-choice, .io-class-choice, .io-occlusion-input').forEach(input => input.addEventListener('change', () => {
  updateOcclusalClassFields(); renderChart(); saveOdontogram();
}));
all('.io-occlusion-input').forEach(input => input.addEventListener('input', refreshRecallNote));
updateOcclusalClassFields();

byId('malocclusionEnabled').addEventListener('change', () => {
  updateOcclusalClassFields();
  if (byId('malocclusionEnabled').checked) byId('malocclusionType').focus();
  renderChart(); saveOdontogram();
});

recallNoteFieldIds.forEach(id => {
  const input = byId(id);
  input.addEventListener('change', () => {
    updateRecallPreceptors(); renderChart(); saveOdontogram();
    if (id.endsWith('Preceptor') && input.value === 'Others') {
      const otherId = id === 'notePreceptor' ? 'notePreceptorOther' : id.replace('Preceptor','Other');
      byId(otherId).focus();
    }
  });
  if (input.type === 'text') input.addEventListener('input', refreshRecallNote);
});
updateRecallPreceptors();

function refreshRecallNote() {
  renderChart();
  saveOdontogram();
}

// Select Yes/No by value and advance through the visible form rows.
const recallYesNoRows = '.cohri-panel .cohri-row, .cleaning-option-row, .extra-oral-row, .oral-screening-row';
all(recallYesNoRows).forEach(row => {
  if (row.querySelector('input[type="radio"]')) row.tabIndex = 0;
});
document.addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  if (!['n','y'].includes(key) || event.ctrlKey || event.metaKey || event.altKey || event.repeat || event.isComposing) return;
  const target = event.target;
  if (!(target instanceof Element) || target.closest('textarea, select, input:not([type="radio"]):not([type="checkbox"]), [contenteditable="true"]')) return;
  const row = target.closest(recallYesNoRows);
  if (!row || row.closest('[hidden]')) return;
  const values = key === 'n' ? ['no','no-change','none'] : ['yes','change'];
  const option = [...row.querySelectorAll('input[type="radio"]')].find(input => values.includes(input.value));
  if (!option || option.disabled) return;
  event.preventDefault(); event.stopImmediatePropagation();
  option.click();
  const rows = [...all(recallYesNoRows)].filter(item => item.querySelector('input[type="radio"]') && !item.closest('[hidden]') && item.getClientRects().length);
  const next = rows[rows.indexOf(row)+1];
  if (next) next.focus();
}, true);
