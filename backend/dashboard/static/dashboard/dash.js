/* Pip's Puzzles dashboard: chart tooltips, puzzle previews (drawn the way the game shows them) and the
   live puzzle builder. Plain script, no build step. */
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const el = (tag, attrs = {}, kids = []) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'text') node.textContent = v;
      else if (k === 'style') node.style.cssText = v;
      else node.setAttribute(k, v);
    }
    for (const kid of [].concat(kids)) if (kid != null) node.append(kid);
    return node;
  };
  const svgEl = (tag, attrs = {}) => {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  };

  // ------------------------------------------------------------------ charts: hover a day to see its numbers

  function initCharts() {
    const tip = $('#tooltip');
    $$('[data-chart]').forEach((chart) => {
      const svg = $('svg', chart);
      const cross = $('.crosshair', svg);
      const show = (hit) => {
        const x = Number(hit.dataset.x);
        cross.setAttribute('x1', x);
        cross.setAttribute('x2', x);
        svg.classList.add('hover');
        const [day, ...values] = hit.dataset.tip.split('|');
        tip.replaceChildren(el('b', { text: day }), ...values.map((v) => el('div', { text: v })));
        const box = svg.getBoundingClientRect();
        const scale = box.width / svg.viewBox.baseVal.width;
        // Inside the plot, beside the crosshair, kept within the chart's edges.
        const px = box.left + x * scale;
        const half = tip.offsetWidth / 2 + 4;
        tip.style.left = `${window.scrollX + Math.min(Math.max(px, box.left + half), box.right - half)}px`;
        tip.style.top = `${window.scrollY + box.top + 4}px`;
        tip.classList.add('show');
      };
      const hide = () => {
        svg.classList.remove('hover');
        tip.classList.remove('show');
      };
      // Snap to the nearest day wherever the pointer (mouse, finger or pen) is over the chart.
      const hits = $$('.hit', svg);
      svg.addEventListener('pointermove', (e) => {
        const box = svg.getBoundingClientRect();
        const x = ((e.clientX - box.left) / box.width) * svg.viewBox.baseVal.width;
        const nearest = hits.reduce((a, b) => (Math.abs(b.dataset.x - x) < Math.abs(a.dataset.x - x) ? b : a));
        show(nearest);
      });
      svg.addEventListener('pointerleave', hide);
    });
  }

  // ------------------------------------------------------------------ "are you sure?" on delete

  function initConfirms() {
    $$('form[data-confirm]').forEach((form) =>
      form.addEventListener('submit', (e) => {
        if (!window.confirm(form.dataset.confirm)) e.preventDefault();
      }),
    );
  }

  // ------------------------------------------------------------------ previews

  const SCENERY = { T: '🌳', H: '🏠', P: '💧', F: '🌼', '.': '' };
  const TRACK_ROT = { '|': ['s', 0], '-': ['s', 1], a: ['c', 0], b: ['c', 1], c: ['c', 2], d: ['c', 3] };
  const STEP = [[0, -1], [1, 0], [0, 1], [-1, 0]];

  function openings(kind, rot) {
    const base = kind === 's' ? [0, 2] : [0, 1];
    return base.map((b) => (((b + rot) % 4) + 4) % 4);
  }

  /** The line from the station, on the solved map: which cells, and does it reach the stall? */
  function traceTracks(cfg) {
    const rows = cfg.map.length;
    const cols = cfg.map[0].length;
    const cells = [];
    let c = cfg.start;
    let r = 0;
    let from = 0;
    for (let guard = 0; guard <= rows * cols; guard++) {
      const t = TRACK_ROT[(cfg.map[r] || '')[c]];
      if (!t) break;
      const [a, b] = openings(t[0], t[1]);
      if (a !== from && b !== from) break;
      cells.push(`${c},${r}`);
      const out = a === from ? b : a;
      c += STEP[out][0];
      r += STEP[out][1];
      from = (out + 2) % 4;
      if (r < 0 || r >= rows || c < 0 || c >= cols) return { cells, reached: out === 2 && r === rows && c === cfg.goal };
    }
    return { cells, reached: false };
  }

  function trackSvg(kind, rot) {
    const svg = svgEl('svg', { viewBox: '0 0 100 100', 'aria-hidden': 'true' });
    const g = svgEl('g', { transform: `rotate(${rot * 90} 50 50)` });
    const d = kind === 's' ? 'M50 0 L50 100' : 'M50 0 A50 50 0 0 0 100 50';
    g.append(svgEl('path', { d, class: 'sleeper' }), svgEl('path', { d, class: 'rail' }));
    svg.append(g);
    return svg;
  }

  function renderTracks(box, cfg, art, solved) {
    const ok = cfg && Array.isArray(cfg.map) && cfg.map.length && Array.isArray(cfg.taps);
    if (!ok) return box.replaceChildren(el('p', { class: 'muted', text: 'Press Generate to make a track map.' }));
    const cols = cfg.map[0].length;
    const line = new Set(traceTracks(cfg).cells);
    const edge = (col, src, label) => {
      const row = el('div', { class: 'tgrid-edge', style: `display:grid;grid-template-columns:repeat(${cols},1fr)` });
      for (let c = 0; c < cols; c++) row.append(el('span', {}, c === col ? el('img', { src, alt: label, style: 'width:70%' }) : null));
      return row;
    };
    const grid = el('div', { class: 'tgrid', style: `grid-template-columns:repeat(${cols},1fr)` });
    cfg.map.forEach((row, r) =>
      row.split('').forEach((ch, c) => {
        const t = TRACK_ROT[ch];
        if (!t) return grid.append(el('div', { text: SCENERY[ch] ?? ch }));
        const taps = Number((cfg.taps[r] || '')[c] || 0);
        const rot = solved ? t[1] : t[1] - taps;
        const onLine = solved && line.has(`${c},${r}`);
        grid.append(el('div', { class: `track${onLine ? ' line' : ''}` }, trackSvg(t[0], rot)));
      }),
    );
    box.replaceChildren(el('div', { style: 'display:grid;gap:4px;justify-items:center;width:100%' }, [
      edge(cfg.start, art.station, 'Station'),
      grid,
      edge(cfg.goal, art.stall, 'Jalebi stall'),
    ]));
  }

  function renderMaze(box, maze, art) {
    if (!maze || !Array.isArray(maze.map) || !maze.map.length) return box.replaceChildren(el('p', { class: 'muted', text: 'Start from one of the template mazes.' }));
    const gates = maze.gates || {};
    const leverOf = {};
    Object.entries(gates).forEach(([G, g]) => g && g.lever && (leverOf[g.lever] = g));
    const lanes = new Set();
    const monkeys = new Map();
    (maze.monkeys || []).forEach((m) => {
      for (let p = m.min; p <= m.max; p++) lanes.add(m.axis === 'h' ? `${p},${m.line}` : `${m.line},${p}`);
      monkeys.set(m.axis === 'h' ? `${m.start},${m.line}` : `${m.line},${m.start}`, true);
    });
    const cols = maze.map[0].length;
    const grid = el('div', { class: 'mgrid', style: `grid-template-columns:repeat(${cols},1fr)` });
    maze.map.forEach((row, r) =>
      row.split('').forEach((ch, c) => {
        const key = `${c},${r}`;
        const cell = el('div', { class: lanes.has(key) ? 'lane' : '' });
        if (ch === '#') cell.classList.add('house');
        else if (ch === 'R') cell.classList.add('rail');
        else if (ch === 'S') cell.append(el('img', { src: art.gappu, alt: 'Start' }));
        else if (ch === 'J') cell.append(el('img', { src: (maze.goal && art.goals[maze.goal]) || art.stall, alt: maze.goal || 'Jalebis' }));
        else if (ch === 'o') cell.append(el('img', { src: art.laddoo, alt: 'Laddoo' }));
        else if (ch === 'C') cell.textContent = '🐄';
        else if (ch === 'x') cell.textContent = '🔀';
        else if (gates[ch]) {
          const g = gates[ch];
          const icon = svgEl('svg', { viewBox: '0 0 12 12', width: '60%', height: '60%' });
          icon.append(svgEl('path', { d: g.glyph || '', fill: '#fff' }));
          cell.append(el('span', { class: 'gate', style: `background:${g.color || '#888'}`, title: `${g.name} gate` }, icon));
        } else if (leverOf[ch]) cell.append(el('span', { style: `border-bottom:4px solid ${leverOf[ch].color}`, title: `${leverOf[ch].name} lever`, text: '🕹️' }));
        else if (ch !== '.') cell.textContent = ch;
        if (monkeys.has(key)) cell.append(el('span', { style: 'position:absolute;right:0;bottom:0;font-size:12px', text: '🐒' }));
        grid.append(cell);
      }),
    );
    box.replaceChildren(grid);
  }

  function renderSlide(box, picture, size, start) {
    if (!picture) return box.replaceChildren(el('p', { class: 'muted', text: 'Pick a picture.' }));
    if (!Array.isArray(start) || start.length !== size * size) {
      return box.replaceChildren(el('div', { style: 'display:grid;gap:8px;justify-items:center' }, [
        el('img', { class: 'preview-pic', src: picture, alt: '' }),
        el('p', { class: 'muted small', text: 'Press Shuffle to mix it up (or it will be shuffled when you save).' }),
      ]));
    }
    const grid = el('div', { class: 'slide-grid', style: `grid-template-columns:repeat(${size},1fr)` });
    start.forEach((t) => {
      if (t < 0) return grid.append(el('span', { class: 'gap' }));
      const col = t % size;
      const row = Math.floor(t / size);
      const pos = (v) => (size > 1 ? (v / (size - 1)) * 100 : 0);
      grid.append(el('span', { style: `background-image:url("${picture}");background-size:${size * 100}% ${size * 100}%;background-position:${pos(col)}% ${pos(row)}%` }, el('em', { text: t + 1 })));
    });
    const img = new Image();
    img.onload = () => $$('span', grid).forEach((s) => (s.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`));
    img.src = picture;
    box.replaceChildren(grid);
  }

  function renderJigsaw(box, picture, cols, rows, spin) {
    if (!picture) return box.replaceChildren(el('p', { class: 'muted', text: 'Pick a picture.' }));
    const lines = el('div', { class: 'jig-grid', style: `grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},1fr)` });
    for (let i = 0; i < cols * rows; i++) lines.append(el('span'));
    box.replaceChildren(el('div', { style: 'display:grid;gap:8px;width:100%' }, [
      el('div', { class: 'jig-wrap' }, [el('img', { class: 'preview-pic', src: picture, alt: '' }), lines]),
      el('p', { class: 'muted small', style: 'margin:0', text: `${cols * rows} pieces${spin ? ', most start turned round (tap to spin)' : ''}.` }),
    ]));
  }

  function renderShadow(box, friends, cols, art) {
    if (!friends.length) return box.replaceChildren(el('p', { class: 'muted', text: 'Pick some friends.' }));
    const row = (cls) => el('div', { class: `art-row ${cls}`, style: `display:grid;grid-template-columns:repeat(${Math.min(cols, friends.length)},auto);justify-content:center` },
      friends.map((f) => el('figure', {}, [el('img', { src: art.friends[f], alt: '' }), cls ? null : el('figcaption', { text: f[0].toUpperCase() + f.slice(1) })])));
    box.replaceChildren(el('div', { style: 'display:grid;gap:10px' }, [
      el('p', { class: 'muted small', style: 'margin:0', text: 'Shadows on the board:' }), row('shadowed'),
      el('p', { class: 'muted small', style: 'margin:0', text: 'Friends to drag:' }), row(''),
    ]));
  }

  function renderMemory(box, snacks, cols, art) {
    if (!snacks.length) return box.replaceChildren(el('p', { class: 'muted', text: 'Pick some snacks.' }));
    const perRow = cols || (snacks.length <= 3 ? 3 : 4);
    const grid = el('div', { class: 'cards-grid', style: `grid-template-columns:repeat(${perRow},1fr);width:${Math.min(320, perRow * 72)}px` });
    for (let i = 0; i < snacks.length * 2; i++) grid.append(el('span', { text: '?' }));
    box.replaceChildren(el('div', { style: 'display:grid;gap:10px;justify-items:center' }, [
      grid,
      el('div', { class: 'art-row' }, snacks.map((s) => el('img', { src: art.snacks[s], alt: s, title: s }))),
      el('p', { class: 'muted small', style: 'margin:0', text: `${snacks.length * 2} cards, ${perRow} per row.` }),
    ]));
  }

  // Rangoli: the same drawing as the game (app/src/game/rangoli.ts and src/components/RangoliArt.tsx).
  const RANGOLI_COLORS = { red: '#E53935', orange: '#FF9F1C', yellow: '#FFD23F', green: '#3FAE5A', blue: '#2E6FD9', purple: '#9C6ADE', pink: '#FF5C8A', white: '#FFFFFF' };
  const RANGOLI_FLOORS = { rangoli: '#4B2E83', kolam: '#4A3A2E', pookalam: '#8A6248', alpana: '#A93226', mandana: '#9C4A26' };
  function rangoliShape(shape, w, h) {
    switch (shape) {
      case 'disc':
      case 'dot': {
        const r = Math.min(w, h);
        return `M${-r},0 a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0 Z`;
      }
      case 'petal': return `M0,${-h} Q${w * 1.3},0 0,${h} Q${-w * 1.3},0 0,${-h} Z`;
      case 'leaf': return `M0,${-h} Q${w * 0.9},${-h * 0.1} 0,${h} Q${-w * 0.9},${-h * 0.1} 0,${-h} Z`;
      case 'drop': return `M0,${-h} C${w * 0.7},${-h * 0.2} ${w},${h * 0.5} 0,${h} C${-w},${h * 0.5} ${-w * 0.7},${-h * 0.2} 0,${-h} Z`;
      case 'diamond': return `M0,${-h} L${w},0 L0,${h} L${-w},0 Z`;
      default: return '';
    }
  }
  function renderRangoli(box, cfg) {
    if (!cfg || !Array.isArray(cfg.rings) || cfg.rings.length < 2) return box.replaceChildren(el('p', { class: 'muted', text: 'Start from one of the patterns.' }));
    const svg = svgEl('svg', { viewBox: '-100 -100 200 200', class: 'rangoli-preview' });
    svg.append(svgEl('circle', { r: 99, fill: RANGOLI_FLOORS[cfg.style] || '#4B2E83' }));
    const band = 92 / (cfg.rings.length - 0.5);
    cfg.rings.forEach((ring, i) => {
      const count = Math.max(1, Number(ring.count) || 1);
      const colors = Array.isArray(ring.colors) && ring.colors.length ? ring.colors : ['white'];
      const r = band * i;
      const gap = i ? (2 * Math.PI * r) / count : band;
      const w = i ? Math.min(band * 0.44, gap * 0.46) : band * 0.5;
      const h = i ? band * 0.46 : band * 0.5;
      for (let k = 0; k < count; k++) {
        const angle = (i % 2 ? 180 / count : 0) + (k * 360) / count;
        const rad = (angle * Math.PI) / 180;
        svg.append(svgEl('path', {
          d: rangoliShape(ring.shape, w, h),
          fill: RANGOLI_COLORS[colors[k % colors.length]] || '#888',
          transform: `translate(${(r * Math.sin(rad)).toFixed(2)} ${(-r * Math.cos(rad)).toFixed(2)}) rotate(${angle.toFixed(2)})`,
        }));
      }
    });
    const pots = [...new Set([...cfg.rings.flatMap((ring) => ring.colors || []), ...(cfg.extra || [])])];
    box.replaceChildren(el('div', { style: 'display:grid;gap:8px;justify-items:center;width:100%' }, [
      svg,
      el('p', { class: 'muted small', style: 'margin:0', text: `Colour pots: ${pots.join(', ')}.` }),
    ]));
  }

  function renderPreview(box, d, opts = {}) {
    switch (d.kind) {
      case 'jigsaw': return renderJigsaw(box, d.picture, d.cols, d.rows, d.spin);
      case 'slide': return renderSlide(box, d.picture, d.size, d.start);
      case 'shadow': return renderShadow(box, d.friends || [], d.cols || 3, d.art);
      case 'memory': return renderMemory(box, d.snacks || [], d.cols, d.art);
      case 'tracks': return renderTracks(box, d.tracks, d.art, opts.solved);
      case 'maze': return renderMaze(box, d.maze, d.art);
      case 'rangoli': return renderRangoli(box, d.rangoli);
      default: box.replaceChildren();
    }
  }

  function renderSavedPreview() {
    const box = $('#preview');
    const data = JSON.parse($('#preview-data').textContent);
    let solved = false;
    const draw = () => renderPreview(box, data, { solved });
    draw();
    if (data.kind === 'tracks') {
      const btn = el('button', { type: 'button', class: 'btn btn-small', text: 'Show it solved' });
      btn.addEventListener('click', () => {
        solved = !solved;
        btn.textContent = solved ? 'Show how it starts' : 'Show it solved';
        draw();
      });
      box.after(el('div', { class: 'row', style: 'margin-top:10px' }, btn));
    }
  }

  // ------------------------------------------------------------------ the puzzle builder

  function startBuilder() {
    const form = $('#builder');
    const data = JSON.parse($('#builder-data').textContent);
    const art = data.art;
    const box = $('#preview');
    const checks = $('#checks');
    const note = $('#preview-note');
    const csrf = $('input[name=csrfmiddlewaretoken]', form).value;
    let uploadUrl = data.currentImage;
    let solved = false;
    let checkTimer = null;
    let checkSeq = 0;

    const val = (name) => (form.elements[name] ? form.elements[name].value : '');
    const checked = (name) => $$(`input[name="${name}"]:checked`, form).map((i) => i.value);
    const kind = () => (checked('kind')[0] || 'jigsaw');
    const picture = () => {
      const p = checked('picture')[0];
      return p === 'upload' ? uploadUrl : art.pictures[p];
    };
    const parse = (text) => {
      try {
        return { value: JSON.parse(text) };
      } catch (e) {
        return { error: e.message };
      }
    };
    const setChecks = (items) => checks.replaceChildren(...items.map(([ok, text]) => el('li', { class: ok ? 'ok' : 'bad', text: `${ok ? '✓' : '✗'} ${text}` })));

    function showSections() {
      const k = kind();
      $$('[data-for]', form).forEach((s) => (s.hidden = !s.dataset.for.split(' ').includes(k)));
      $$('[data-when-picture]', form).forEach((s) => (s.hidden = checked('picture')[0] !== s.dataset.whenPicture));
      // Number the steps after the shared ones.
      let n = 3;
      $$('[data-for]', form).filter((s) => !s.hidden && $('legend', s)).forEach((s) => ($('legend', s).textContent = $('legend', s).textContent.replace(/^\d+\./, `${n++}.`)));
    }

    function slideBoard() {
      const parsed = parse(val('slide_board') || 'null').value;
      return parsed && Array.isArray(parsed.start) ? parsed : null;
    }

    function draw() {
      const k = kind();
      note.textContent = '';
      const d = { kind: k, art };
      if (k === 'jigsaw') Object.assign(d, { picture: picture(), cols: Number(val('cols')), rows: Number(val('rows')), spin: form.elements.spin.checked });
      if (k === 'slide') {
        const b = slideBoard();
        const size = Number(val('size'));
        Object.assign(d, { picture: picture(), size, start: b && b.start.length === size * size ? b.start : null });
        if (d.start) note.textContent = `Fewest moves: ${b.par}`;
      }
      if (k === 'shadow') Object.assign(d, { friends: checked('friends'), cols: Number(val('shadow_cols')) });
      if (k === 'memory') Object.assign(d, { snacks: checked('snacks'), cols: Number(val('memory_cols')) || null });
      if (k === 'tracks') d.tracks = parse(val('tracks_json')).value;
      if (k === 'maze') d.maze = parse(val('maze_json')).value;
      if (k === 'rangoli') d.rangoli = parse(val('rangoli_json')).value;
      renderPreview(box, d, { solved });
      localChecks(k, d);
    }

    function localChecks(k, d) {
      clearTimeout(checkTimer);
      if (k === 'jigsaw') setChecks([[!!d.picture, d.picture ? 'Picture chosen' : 'Pick a picture'], [true, `${d.cols * d.rows} pieces`]]);
      if (k === 'slide') setChecks([[!!d.picture, d.picture ? 'Picture chosen' : 'Pick a picture'], [true, d.start ? 'Shuffled: always solvable' : 'Will be shuffled when you save']]);
      if (k === 'shadow') setChecks([[d.friends.length >= 2 && d.friends.length <= 6, `${d.friends.length} friend${d.friends.length === 1 ? '' : 's'} (2 to 6)`]]);
      if (k === 'memory') setChecks([[d.snacks.length >= 2 && d.snacks.length <= 8, `${d.snacks.length} snack${d.snacks.length === 1 ? '' : 's'} (2 to 8)`]]);
      if (k === 'tracks' || k === 'maze' || k === 'rangoli') {
        const text = val(`${k}_json`);
        if (!text.trim()) return setChecks([[false, { tracks: 'Press Generate to make a map', maze: 'Start from a template maze', rangoli: 'Start from one of the patterns' }[k]]]);
        const parsed = parse(text);
        if (parsed.error) return setChecks([[false, `Not valid JSON yet: ${parsed.error}`]]);
        setChecks([[true, 'Checking…']]);
        checkTimer = setTimeout(() => serverCheck(k, parsed.value), 350);
      }
    }

    async function serverCheck(k, value) {
      const seq = ++checkSeq;
      const res = await fetch(form.dataset.toolCheck, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf },
        body: JSON.stringify({ kind: k, value }),
      }).then((r) => r.json()).catch(() => ({ problems: ['Could not reach the server to check it.'] }));
      if (seq !== checkSeq) return; // a newer check is on its way
      if (res.problems.length) return setChecks(res.problems.map((p) => [false, p]));
      setChecks({
        tracks: [[true, 'The line joins the station to the stall'], [true, `Fewest taps to fix it: ${res.par}`]],
        maze: [[true, 'Gappu can reach the goal'], [true, 'All 3 laddoos can be reached']],
        rangoli: [[true, 'The game can draw it'], [true, 'Every shape has a colour from the pots']],
      }[k]);
    }

    // --- tools
    $('#shuffle').addEventListener('click', async (e) => {
      e.target.disabled = true;
      const q = new URLSearchParams({ size: val('size'), difficulty: val('difficulty') });
      const res = await fetch(`${form.dataset.toolSlide}?${q}`).then((r) => r.json()).catch(() => ({}));
      e.target.disabled = false;
      if (!res.start) return setChecks([[false, res.error || 'Could not reach the server to shuffle.']]);
      form.elements.slide_board.value = JSON.stringify({ start: res.start, par: res.par });
      draw();
    });
    $('#gen-tracks').addEventListener('click', async (e) => {
      e.target.disabled = true;
      const q = new URLSearchParams({ width: $('#tw').value, height: $('#th').value, decoys: $('#td').value });
      const res = await fetch(`${form.dataset.toolTracks}?${q}`).then((r) => r.json()).catch(() => ({}));
      e.target.disabled = false;
      if (!res.config) return setChecks([[false, res.error || 'Could not reach the server to make a map.']]);
      form.elements.tracks_json.value = JSON.stringify(res.config, null, 2);
      solved = false;
      draw();
    });
    $$('[data-maze-template]', form).forEach((b) =>
      b.addEventListener('click', () => {
        if (val('maze_json').trim() && !window.confirm('Replace the maze you have with this template?')) return;
        form.elements.maze_json.value = JSON.stringify(data.mazeTemplates[b.dataset.mazeTemplate].value, null, 2);
        draw();
      }),
    );
    $$('[data-rangoli-template]', form).forEach((b) =>
      b.addEventListener('click', () => {
        if (val('rangoli_json').trim() && !window.confirm('Replace the pattern you have with this one?')) return;
        form.elements.rangoli_json.value = JSON.stringify(data.rangoliTemplates[b.dataset.rangoliTemplate].value, null, 2);
        draw();
      }),
    );
    const solvedBtn = el('button', { type: 'button', class: 'btn btn-small', text: 'Show it solved' });
    solvedBtn.addEventListener('click', () => {
      solved = !solved;
      solvedBtn.textContent = solved ? 'Show how it starts' : 'Show it solved';
      draw();
    });
    box.after(el('div', { class: 'row', style: 'margin-top:10px', 'data-for': 'tracks' }, solvedBtn));

    form.elements.image.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) uploadUrl = URL.createObjectURL(file);
      draw();
    });
    // A new board size means the old shuffle no longer fits.
    form.elements.size.addEventListener('change', () => (form.elements.slide_board.value = ''));
    form.addEventListener('change', () => {
      showSections();
      draw();
    });
    form.addEventListener('input', (e) => {
      if (e.target.tagName === 'TEXTAREA') draw();
    });
    showSections();
    draw();
  }

  window.Dash = { renderSavedPreview, startBuilder };
  initCharts();
  initConfirms();
})();
