let allUnits = [],
  filteredUnits = [],
  comparisonUnits = [],
  sortConfig = { key: 'costPerStat', reverse: false };
async function loadData() {
  try {
    const r = await fetch('./data2024.json'),
      d = await r.json();
    let u = [];
    d.data &&
      d.data.heroes &&
      (u = u.concat(
        d.data.heroes.map((h) => ({ ...h, unitCategory: 'hero' })),
      ));
    d.data &&
      d.data.warriors &&
      (u = u.concat(
        d.data.warriors.map((w) => ({ ...w, unitCategory: 'warrior' })),
      ));
    allUnits = u.map((unit) => processUnit(unit));
    populateFactionFilter();
    applyFilters();
  } catch (e) {
    console.error('Error loading data:', e);
    document.getElementById('unitTableBody').innerHTML =
      '<tr><td colspan="7" style="color:red;">Error loading data. Make sure data2024.json is in the same directory.</td></tr>';
  }
}
function processUnit(unit) {
  const m = unit.movement || 0,
    f = unit.fight || 0,
    sh = unit.shoot || 0,
    s = unit.strength || 0,
    d = unit.defence || 0,
    a = unit.attack || 0,
    w = unit.wounds || 0,
    c = unit.courage || 0,
    i = unit.intelligence || 0,
    mi = unit.might || 0,
    wi = unit.will || 0,
    fa = unit.fate || 0,
    ts = m + f + s + d + a + w + mi + wi + fa - sh - c - i,
    p = unit.points || 0,
    cs = 0 !== ts ? (p / ts).toFixed(2) : 'N/A';
  let pf = '';
  if (unit.factions && Array.isArray(unit.factions))
    'object' == typeof unit.factions[0] && unit.factions[0].name
      ? (pf = unit.factions[0].name)
      : 'string' == typeof unit.factions[0] && (pf = unit.factions[0]);
  else if (unit.faction && Array.isArray(unit.faction))
    pf = unit.faction[0] || '';
  let put = 'Other';
  if (unit.unitType && Array.isArray(unit.unitType))
    for (const t of unit.unitType)
      if (
        [
          'Hero',
          'Infantry',
          'Cavalry',
          'Monster',
          'War Beast',
          'Unique',
        ].includes(t)
      ) {
        put = t;
        break;
      }
  const r = unit.race && Array.isArray(unit.race) ? unit.race[0] : '',
    iu =
      !0 === unit.unique || (unit.unitType && unit.unitType.includes('Unique'));
  return {
    name: unit.name,
    race: r,
    faction: pf,
    points: p,
    movement: m,
    fight: f,
    shoot: sh,
    strength: s,
    defence: d,
    attack: a,
    wounds: w,
    courage: c,
    intelligence: i,
    might: mi,
    will: wi,
    fate: fa,
    totalStats: ts,
    costPerStat: cs,
    unitType: put,
    isUnique: iu,
    specialRules: unit.specialRules || [],
    wargear: unit.wargear || [],
    options: unit.options || [],
    magicalPowers: unit.magicalPowers || [],
  };
}
function populateFactionFilter() {
  [...new Set(allUnits.map((u) => u.faction).filter((f) => f))]
    .sort()
    .forEach((faction) => {
      const o = document.createElement('option');
      o.value = faction;
      o.textContent = faction;
      document.getElementById('factionFilter').appendChild(o);
    });
}
function applyFilters() {
  const st = document.getElementById('searchInput').value.toLowerCase(),
    ut = Array.from(document.querySelectorAll('.unitTypeFilter:checked')).map(
      (cb) => cb.value,
    ),
    ff = document.getElementById('factionFilter').value,
    uo = document.getElementById('uniqueOnly').checked;
  filteredUnits = allUnits.filter(
    (unit) =>
      unit.name.toLowerCase().includes(st) &&
      (0 === ut.length || ut.includes(unit.unitType)) &&
      (!ff || unit.faction === ff) &&
      (!uo || unit.isUnique),
  );
  sortTable(sortConfig.key);
}
function sortTable(key) {
  sortConfig.key === key
    ? (sortConfig.reverse = !sortConfig.reverse)
    : ((sortConfig.key = key), (sortConfig.reverse = false));
  filteredUnits.sort((a, b) => {
    let av = a[key],
      bv = b[key];
    'costPerStat' === key &&
      ((av = 'N/A' === a.costPerStat ? Infinity : parseFloat(a.costPerStat)),
      (bv = 'N/A' === b.costPerStat ? Infinity : parseFloat(b.costPerStat)));
    'string' == typeof av && (av = av.toLowerCase());
    'string' == typeof bv && (bv = bv.toLowerCase());
    return av < bv
      ? sortConfig.reverse
        ? 1
        : -1
      : av > bv
        ? sortConfig.reverse
          ? -1
          : 1
        : 0;
  });
  renderTable();
}
function renderTable() {
  const tb = document.getElementById('unitTableBody'),
    tc = document.getElementById('totalCount'),
    vc = document.getElementById('visibleCount');
  tc.textContent = allUnits.length;
  vc.textContent = filteredUnits.length;
  if (0 === filteredUnits.length) {
    tb.innerHTML =
      '<tr><td colspan="7" class="loading">No units match filters</td></tr>';
    return;
  }
  const vc_arr = filteredUnits
      .filter((u) => 'N/A' !== u.costPerStat)
      .map((u) => parseFloat(u.costPerStat)),
    ac =
      vc_arr.length > 0 ? vc_arr.reduce((a, b) => a + b, 0) / vc_arr.length : 0;
  tb.innerHTML = filteredUnits
    .map((unit) => {
      let rc = '';
      'N/A' !== unit.costPerStat &&
        (rc =
          parseFloat(unit.costPerStat) < 0.9 * ac
            ? 'efficient-high'
            : parseFloat(unit.costPerStat) > 1.1 * ac
              ? 'efficient-low'
              : 'efficient-mid');
      return `<tr class="${rc} clickable" onclick="addToComparison('${unit.name}')">
            <td>${unit.name}</td>
            <td>${unit.race}</td>
            <td>${unit.faction}</td>
            <td>${unit.points}</td>
            <td>${unit.totalStats}</td>
            <td class="stat-value" style="background:rgba(132,25,18,0.2);">${unit.costPerStat}</td>
            <td>${unit.unitType}</td>
          </tr>`;
    })
    .join('');
}
function switchTab(tabName) {
  document
    .querySelectorAll('.tab-content')
    .forEach((el) => el.classList.remove('active'));
  document
    .querySelectorAll('.tab-button')
    .forEach((el) => el.classList.remove('active'));
  document.getElementById(tabName).classList.add('active');
  event.target.classList.add('active');
  'factionView' === tabName && renderFactionView();
}
function addToComparison(unitName) {
  const u = allUnits.find((u) => u.name === unitName);
  u &&
    (comparisonUnits.find((u) => u.name === unitName)
      ? (comparisonUnits = comparisonUnits.filter((u) => u.name !== unitName))
      : 3 > comparisonUnits.length
        ? comparisonUnits.push(u)
        : alert('Maximum 3 units for comparison'));
  renderComparison();
  switchTab('comparison');
}
function renderComparison() {
  const cg = document.getElementById('comparisonGrid');
  0 === comparisonUnits.length
    ? (cg.innerHTML =
        '<p style="color:#999;grid-column:1/-1;">Select units from the ranked view to compare</p>')
    : (cg.innerHTML = comparisonUnits
        .map(
          (unit) => `<div class="unit-card">
            <div class="unit-name">${unit.name}</div>
            <div class="unit-stats">
              <div class="unit-stat">
                <span class="unit-stat-label">Race:</span> 
                <span class="unit-stat-value">${unit.race || 'N/A'}</span>
              </div>
              <div class="unit-stat">
                <span class="unit-stat-label">Points:</span> 
                <span class="unit-stat-value">${unit.points}</span>
              </div>
              <div class="unit-stat">
                <span class="unit-stat-label">Movement:</span> 
                <span class="unit-stat-value">${unit.movement}</span>
              </div>
              <div class="unit-stat">
                <span class="unit-stat-label">Fight:</span> 
                <span class="unit-stat-value">${unit.fight}</span>
              </div>
              <div class="unit-stat">
                <span class="unit-stat-label">Shoot:</span> 
                <span class="unit-stat-value">${unit.shoot}</span>
              </div>
              <div class="unit-stat">
                <span class="unit-stat-label">Strength:</span> 
                <span class="unit-stat-value">${unit.strength}</span>
              </div>
              <div class="unit-stat">
                <span class="unit-stat-label">Defence:</span> 
                <span class="unit-stat-value">${unit.defence}</span>
              </div>
              <div class="unit-stat">
                <span class="unit-stat-label">Attack:</span> 
                <span class="unit-stat-value">${unit.attack}</span>
              </div>
              <div class="unit-stat">
                <span class="unit-stat-label">Wounds:</span> 
                <span class="unit-stat-value">${unit.wounds}</span>
              </div>
              <div class="unit-stat">
                <span class="unit-stat-label">Courage:</span> 
                <span class="unit-stat-value">${unit.courage}</span>
              </div>
              <div class="unit-stat">
                <span class="unit-stat-label">Intelligence:</span> 
                <span class="unit-stat-value">${unit.intelligence}</span>
              </div>
              <div class="unit-stat">
                <span class="unit-stat-label">Might:</span> 
                <span class="unit-stat-value">${unit.might}</span>
              </div>
              <div class="unit-stat">
                <span class="unit-stat-label">Will:</span> 
                <span class="unit-stat-value">${unit.will}</span>
              </div>
              <div class="unit-stat">
                <span class="unit-stat-label">Fate:</span> 
                <span class="unit-stat-value">${unit.fate}</span>
              </div>
            </div>
            <div style="margin-top:10px;padding-top:10px;border-top:1px solid #555;">
              <div class="detail-row">
                <span class="detail-label">Total Stats:</span>
                <span class="detail-value">${unit.totalStats}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Cost/Stat:</span>
                <span class="detail-value">${unit.costPerStat}</span>
              </div>
            </div>
            <button
              style="margin-top:10px;background:#555;width:100%;"
              onclick="removeFromComparison('${unit.name.replace(/'/g, "\\'")}')"
            >
              Remove
            </button>
          </div>`,
        )
        .join(''));
}
function removeFromComparison(unitName) {
  comparisonUnits = comparisonUnits.filter((u) => u.name !== unitName);
  renderComparison();
}
function renderFactionView() {
  [...new Set(allUnits.map((u) => u.faction).filter((f) => f))]
    .sort()
    .forEach((faction) => {
      const fu = allUnits.filter((u) => u.faction === faction),
        vc = fu.filter((u) => 'N/A' !== u.costPerStat),
        ac =
          vc.length > 0
            ? vc.reduce((sum, u) => sum + parseFloat(u.costPerStat), 0) /
              vc.length
            : 0;
      let html =
        '<div style="margin-bottom:30px;"><h3 style="color:#841912;margin-bottom:10px;padding-bottom:10px;border-bottom:2px solid #841912;">' +
        faction +
        ' (' +
        fu.length +
        ' units)</h3><div style="margin-bottom:15px;font-size:12px;color:#b0b0b0;">Average Cost/Stat: <span style="color:#41d9f5;font-weight:bold;">' +
        ac.toFixed(2) +
        '</span></div><table style="width:100%;"><thead><tr><th>Unit Name</th><th>Points</th><th>Cost/Stat</th><th>% vs Avg</th><th>Total Stats</th></tr></thead><tbody>' +
        fu
          .map((unit) => {
            const pd =
                'N/A' === unit.costPerStat
                  ? 'N/A'
                  : ((parseFloat(unit.costPerStat) / ac - 1) * 100).toFixed(1) +
                    '%',
              col =
                'N/A' === unit.costPerStat
                  ? '#999'
                  : parseFloat(unit.costPerStat) < ac
                    ? '#4caf50'
                    : '#f44336';
            return (
              '<tr style="cursor:pointer;" onclick="addToComparison(\'' +
              unit.name.replace(/'/g, "\\'") +
              '\')" ><td>' +
              unit.name +
              '</td><td>' +
              unit.points +
              '</td><td style="color:#41d9f5;font-weight:bold;">' +
              unit.costPerStat +
              '</td><td style="color:' +
              col +
              ';font-weight:bold;">' +
              pd +
              '</td><td>' +
              (unit.totalStats >= 0 ? unit.totalStats : 'N/A') +
              '</td></tr>'
            );
          })
          .join('') +
        '</tbody></table></div>';
      document.getElementById('factionContent').innerHTML += html;
    });
}
function resetFilters() {
  document.getElementById('searchInput').value = '';
  document
    .querySelectorAll('.unitTypeFilter')
    .forEach((cb) => (cb.checked = true));
  document.getElementById('factionFilter').value = '';
  document.getElementById('uniqueOnly').checked = false;
  applyFilters();
}
window.addEventListener('load', loadData);
