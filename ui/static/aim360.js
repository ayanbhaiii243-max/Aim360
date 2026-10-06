/* AIM360° application script (split from the self-contained build) */
window.PHX_SKIP_CONNECT=true;
;





    /* ── Command palette (Ctrl+K) ── */

    (function () {

      const backdrop = document.getElementById('cmdkBackdrop');

      const input = document.getElementById('cmdkInput');

      const list = document.getElementById('cmdkList');

      if (!backdrop || !input || !list) return;

      let entries = [];

      let filtered = [];

      let active = 0;

      let query = '';

      /* tab → module icon (mirrors GROUPS/MODULES ri-* names) */
      const TAB_ICONS = {
        'combat': 'ri-crosshair-2-line',
        'humanization': 'ri-brain-line',
        'rage': 'ri-fire-line',
        'radar': 'ri-radar-line',
        'spike-timer': 'ri-timer-flash-line',
        'colors': 'ri-palette-line',
        'misc': 'ri-tools-line',
        'config': 'ri-save-line',
        'silent': 'ri-ghost-line',
        'flicker': 'ri-flashlight-fill'
      };

      function iconOf(tab) { return TAB_ICONS[tab] || 'ri-settings-4-line'; }

      function tabNameOf(id) {

        return (typeof tabLabels !== 'undefined' && tabLabels[id]) ? tabLabels[id] : id;

      }

      function escapeHtml(s) {

        return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

      }

      function buildIndex() {

        entries = [];

        document.querySelectorAll('.tab-pane').forEach(pane => {

          const tabId = pane.id.replace(/^tab-/, '');

          const tabName = tabNameOf(tabId);

          entries.push({ label: tabName, tab: tabId, tabName: tabName, row: null, isTab: true });

          pane.querySelectorAll('.ctrl-row').forEach(row => {

            if (row.style.display === 'none') return;

            const lbl = row.querySelector('.ctrl-label');

            if (!lbl) return;

            const text = lbl.textContent.trim();

            if (!text) return;

            /* enhanceCards() swaps .card-title for a .px-head/.px-banner
               holding .px-h1, and moves master rows into the banner —
               look for either form. */
            const card = row.closest('.card, .ab-card, .px-banner');

            const titleEl = card && card.querySelector('.px-h1, .card-title');

            const section = titleEl ? titleEl.textContent.trim() : '';

            entries.push({ label: text, tab: tabId, tabName: tabName, section: section, row: row, isTab: false });

          });

        });

      }

      function highlight(label, q) {

        if (!q) return escapeHtml(label);

        const idx = label.toLowerCase().indexOf(q);

        if (idx === -1) return escapeHtml(label);

        return escapeHtml(label.slice(0, idx)) +
          '<mark class="cmdk-match">' + escapeHtml(label.slice(idx, idx + q.length)) + '</mark>' +
          escapeHtml(label.slice(idx + q.length));

      }

      function setCount(n) {

        const el = document.getElementById('cmdkCount');

        if (el) el.textContent = n + (n === 1 ? ' result' : ' results');

      }

      function render() {

        list.innerHTML = '';

        if (!filtered.length) {

          list.innerHTML = '<div class="cmdk-empty">' +
            '<i class="ri-search-line"></i>' +
            '<div class="cmdk-empty-line">No matches for &quot;' + escapeHtml(query) + '&quot;</div>' +
            '<div class="cmdk-empty-sub">Try a setting name like &lsquo;smooth&rsquo; or &lsquo;fov&rsquo;</div>' +
            '</div>';

          setCount(0);

          return;

        }

        setCount(filtered.length);

        filtered.forEach((e, i) => {

          const it = document.createElement('div');

          it.className = 'cmdk-item' + (i === active ? ' active' : '');

          const crumb = e.isTab ? 'Tab' : (e.section ? e.tabName + ' · ' + e.section : e.tabName);

          it.innerHTML = '<span class="cmdk-ico"><i class="' + iconOf(e.tab) + '"></i></span>' +
            '<span class="cmdk-label">' + highlight(e.label, query) + '</span>' +
            '<span class="cmdk-tab">' + escapeHtml(crumb) + '</span>' +
            '<kbd class="cmdk-enter">↵</kbd>';

          it.addEventListener('mouseenter', () => { active = i; updateActive(); });

          it.addEventListener('click', () => select(i));

          list.appendChild(it);

        });

      }

      function updateActive() {

        const kids = list.children;

        for (let i = 0; i < kids.length; i++) kids[i].classList.toggle('active', i === active);

        const el = kids[active];

        if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });

      }

      function filter(q) {

        q = q.trim().toLowerCase();

        query = q;

        if (!q) {

          filtered = entries.slice(0, 80);

        } else {

          const starts = [], has = [];

          entries.forEach(e => {

            const l = e.label.toLowerCase();
            const sec = (e.section || '').toLowerCase();

            if (l.startsWith(q)) starts.push(e);

            else if (l.indexOf(q) !== -1 || e.tabName.toLowerCase().indexOf(q) !== -1 || sec.indexOf(q) !== -1) has.push(e);

          });

          filtered = starts.concat(has).slice(0, 80);

        }

        active = 0;

        render();

      }

      function select(i) {

        const e = filtered[i];

        if (!e) return;

        close();

        const navEl = document.querySelector('.sb-item[data-tab="' + e.tab + '"]');

        switchTab(e.tab, navEl);

        if (!e.row) return;

        setTimeout(() => {

          const pane = document.getElementById('tab-' + e.tab);

          const scroller = pane && pane.querySelector('.tab-scroll');

          if (scroller && e.row.offsetParent !== null) {

            scroller.scrollTop = Math.max(0, e.row.offsetTop - 90);

          }

          e.row.classList.remove('cmdk-hit');

          void e.row.offsetWidth;

          e.row.classList.add('cmdk-hit');

          setTimeout(() => e.row.classList.remove('cmdk-hit'), 1700);

        }, 380);

      }

      function open() {

        buildIndex();

        input.value = '';

        filter('');

        backdrop.classList.add('open');

        setTimeout(() => input.focus(), 30);

      }

      function close() { backdrop.classList.remove('open'); }

      function isOpen() { return backdrop.classList.contains('open'); }

      input.addEventListener('input', () => filter(input.value));

      input.addEventListener('keydown', e => {

        if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, filtered.length - 1); updateActive(); }

        else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); updateActive(); }

        else if (e.key === 'Enter') { e.preventDefault(); select(active); }

        else if (e.key === 'Escape') { e.preventDefault(); close(); }

      });

      backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });

      document.addEventListener('keydown', e => {

        if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {

          e.preventDefault();

          isOpen() ? close() : open();

        }

      });

    })();



    function updateAuroraColor(r, g, b) {

      document.documentElement.style.setProperty('--aurora-r', r);

      document.documentElement.style.setProperty('--aurora-g', g);

      document.documentElement.style.setProperty('--aurora-b', b);

    }



    function setAuroraOn(el, on) {

    }



    const _auroraInstances = { forEach: () => { } };



    (function () {

      function initSmooth(el) {
        if (!el || el._smDone) return;
        el._smDone = true;
        el.style.overflowY = 'auto';
        el.style.scrollBehavior = 'smooth';
        el._smReset = function () { el.scrollTop = 0; };
      }

      function initAll() { document.querySelectorAll('.smooth-scroll,.tab-scroll,.sb-nav,.dash-grid').forEach(initSmooth); }

      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);

      else setTimeout(initAll, 0);

      const obs = new MutationObserver(() => setTimeout(initAll, 50));

      obs.observe(document.documentElement, { childList: true, subtree: true });

    })();



    function wrapSliderLava(input) {

      if (input._lavaWrapped || input.closest('.slider-track-wrap') || input.id === 'cpHue' || input.closest('.cpanel')) return;

      input._lavaWrapped = true;

      const wrap = document.createElement('div');

      wrap.className = 'slider-track-wrap';

      const fill = document.createElement('div');

      fill.className = 'slider-track-fill';

      const inner = document.createElement('div');

      inner.className = 'slider-track-fill-inner';

      fill.appendChild(inner);

      input.parentNode.insertBefore(wrap, input);

      wrap.appendChild(fill);

      wrap.appendChild(input);

      input._fillEl = fill;

      updateLavaFill(input);

    }



    function updateLavaFill(el) {

      if (!el._fillEl) return;

      const min = +el.min || 0, max = +el.max || 100;

      const pct = ((+el.value - min) / (max - min));

      el._fillEl.style.width = (pct * 100) + '%';

    }



    function updateSlider(el) {

      updateLavaFill(el);

      let sp = null;

      const row = el.closest('.ctrl-row');

      if (row) sp = row.querySelector('.slider-val');

      if (!sp) sp = el.parentElement.querySelector('.slider-val');

      if (sp) sp.textContent = +el.value;

      if (el.id === 'ab_fov') {

        refreshFovVis('aimbot');

      }

      

      // Send config update via WebSocket

      if (row) {

        const configKey = row.dataset.config;

        if (configKey) {

          const step = el.step || '1';
          const isFloat = step.includes('.') || parseFloat(step) < 1;
          sendConfigUpdate(configKey, isFloat ? parseFloat(el.value) : parseInt(el.value));

          // Track base value for humanization sliders so the master power can scale them
          if (configKey.startsWith('humanization_') && !_applyingMasterHum) {
            const ms = document.getElementById('masterHumSlider');
            const power = ms ? parseFloat(ms.value) : 1.0;
            const displayed = isFloat ? parseFloat(el.value) : parseInt(el.value);
            _humBaseValues[configKey] = power > 0 ? displayed / power : displayed;
            _saveHumBaseValues();
          }

        }

      }

      const modRow = el.closest('.ctrl-row');

      if (modRow) refreshModified(modRow);

    }



    function valBlur(sp) {

      const row = sp.closest('.ctrl-row');

      let slider = null;

      if (row) slider = row.querySelector('input[type=range]');

      if (!slider || slider.type !== 'range') return;

      let v = parseFloat(sp.textContent);

      if (isNaN(v)) v = +slider.value;

      v = Math.max(+slider.min, Math.min(+slider.max, v));

      sp.textContent = Math.round(v);

      slider.value = v;

      updateSlider(slider);

    }

    function valKey(e, sp) { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); sp.blur(); } }



    document.querySelectorAll('input[type=range]').forEach(el => wrapSliderLava(el));



    // ── Dependent-control map: controller data-config → dependent data-config keys ──

    const DEPENDENTS_MAP = {

      "triggerbot_burst_control": ["triggerbot_burst_delay_min", "triggerbot_burst_delay_max"]

    };



    // ── Parse-time init: capture factory defaults baked into the markup ──

    document.querySelectorAll('.ctrl-row[data-config]').forEach(row => {

      const input = row.querySelector('input[type=range]');

      if (input) {

        row._defVal = String(input.defaultValue);

      } else {

        const el = row.querySelector('.checkbox, .switch');

        if (el) row._defActive = el.classList.contains('active');

      }

    });



    function refreshModified(row) {

      if (!row || !row.dataset.config) return;

      const input = row.querySelector('input[type=range]');

      if (input) {

        if (row._defVal === undefined) return;

        const changed = String(input.value) !== row._defVal;

        row.classList.toggle('modified', changed);

        return;

      }

      const el = row.querySelector('.checkbox, .switch');

      if (el) {

        if (row._defActive === undefined) return;

        const changed = el.classList.contains('active') !== row._defActive;

        row.classList.toggle('modified', changed);

      }

    }



    function refreshDependents(controllerKey) {

      const deps = DEPENDENTS_MAP[controllerKey];

      if (!deps) return;

      const ctrl = document.querySelector('[data-config="' + controllerKey + '"]');

      if (!ctrl) return;

      const el = ctrl.querySelector('.checkbox, .switch');

      const on = !!(el && el.classList.contains('active'));

      deps.forEach(depKey => {

        document.querySelectorAll('[data-config="' + depKey + '"]').forEach(depRow => {

          depRow.classList.toggle('dep-disabled', !on);

        });

      });

    }



    function refreshAllDependents() {

      Object.keys(DEPENDENTS_MAP).forEach(k => refreshDependents(k));

    }



    // Live status strip: reflect each major feature's enable toggle

    function refreshStatusStrip() {

      const strip = document.getElementById('statusStrip');

      if (!strip) return;

      strip.querySelectorAll('.ss-chip').forEach(chip => {

        const key = chip.dataset.feat;

        if (!key) return;

        let on = false;

        document.querySelectorAll('.bool-row[data-config="' + key + '"]').forEach(row => {

          const sw = row.querySelector('.checkbox, .switch');

          if (sw && sw.classList.contains('active')) on = true;

        });

        chip.classList.toggle('on', on);

      });

    }



    // Reflect markup-default mismatches and dependent states on first paint

    document.querySelectorAll('.ctrl-row[data-config]').forEach(row => refreshModified(row));

    refreshAllDependents();

    refreshStatusStrip();



    function toggle(el) {

      el.classList.toggle('active');

      el.style.transform = 'scale(0.8)';
      setTimeout(() => { el.style.transform = ''; }, 150);

      const row = el.closest('.bool-row');

      if (!row) return;

      const on = el.classList.contains('active');

      row.classList.toggle('flowing', on);

      setAuroraOn(row, on);



      // Send config update via WebSocket

      const configKey = row.dataset.config;

      if (configKey) {

        sendConfigUpdate(configKey, on);

      }

      refreshModified(row);

      if (configKey && DEPENDENTS_MAP[configKey]) refreshDependents(configKey);

      refreshStatusStrip();

    }

    function toggleDoubleBind(el, rowId) {

      toggle(el);

      const secondRow = document.getElementById(rowId);

      if (secondRow) secondRow.style.display = el.classList.contains('active') ? '' : 'none';

    }



    document.querySelectorAll('.checkbox.active,.switch.active').forEach(el => {

      const row = el.closest('.bool-row');

      if (!row) return;

      row.classList.add('flowing');

      setAuroraOn(row, true);

    });



    (function () {

      const nav = document.querySelector('.sb-item.active');

      if (nav) setAuroraOn(nav, true);

    })();



    const MBTAG = { 0: 'MB1', 1: 'MB3', 2: 'MB2', 3: 'MB4', 4: 'MB5' };

    const MBCODE = { 0: 0x01, 1: 0x04, 2: 0x02, 3: 0x05, 4: 0x06 };



    function keyToHex(key) {

      const keyMap = {

        'SPACE': 0x20, ' ': 0x20,

        'SHIFT': 0xA0, 'Shift': 0xA0,

        'CTRL': 0xA2, 'Control': 0xA2,

        'ALT': 0xA4, 'Alt': 0xA4,

        'CAPSLOCK': 0x14, 'CapsLock': 0x14,

        'PRINTSCREEN': 0x2C, 'PrintScreen': 0x2C,

        'SCROLLLOCK': 0x91, 'ScrollLock': 0x91,

        'PAUSE': 0x13, 'Pause': 0x13,

        'NUMLOCK': 0x90, 'NumLock': 0x90,

        'TAB': 0x09, 'Tab': 0x09,

        'ENTER': 0x0D, 'Enter': 0x0D,

        'ESCAPE': 0x1B, 'Escape': 0x1B,

        'BACKSPACE': 0x08, 'Backspace': 0x08,

        'DELETE': 0x2E, 'Delete': 0x2E,

        'INSERT': 0x2D, 'Insert': 0x2D,

        'HOME': 0x24, 'Home': 0x24,

        'END': 0x23, 'End': 0x23,

        'PAGEUP': 0x21, 'PageUp': 0x21,

        'PAGEDOWN': 0x22, 'PageDown': 0x22,

        'ARROWLEFT': 0x25, 'ArrowLeft': 0x25,

        'ARROWUP': 0x26, 'ArrowUp': 0x26,

        'ARROWRIGHT': 0x27, 'ArrowRight': 0x27,

        'ARROWDOWN': 0x28, 'ArrowDown': 0x28,

      };

      

      if (keyMap[key]) return keyMap[key];

      if (key.length === 1) return key.toUpperCase().charCodeAt(0);

      if (key.startsWith('F') && key.length <= 3) {

        const num = parseInt(key.substring(1));

        if (num >= 1 && num <= 24) return 0x70 + num - 1;

      }

      return 0x01;

    }



    function recordBind(el) {

      el.classList.add('listening'); el.textContent = 'Press key_';

      const row = el.closest('.ctrl-row');

      const configKey = row ? row.dataset.config : null;

      

      function onKey(e) {

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        if (['Meta'].includes(e.key)) return;

        let k = e.key;

        let displayKey = k;

        if (k === ' ') displayKey = 'SPACE';

        else if (k === 'Control') displayKey = 'CTRL';

        else if (k === 'Shift') displayKey = 'SHIFT';

        else if (k === 'Alt') displayKey = 'ALT';

        else if (k === 'CapsLock') displayKey = 'CAPSLOCK';

        else if (k === 'PrintScreen') displayKey = 'PRTSCN';

        else if (k === 'ScrollLock') displayKey = 'SCRLK';

        else if (k === 'Pause') displayKey = 'PAUSE';

        else if (k === 'NumLock') displayKey = 'NUMLK';

        else if (k.length === 1) displayKey = k.toUpperCase();

        

        el.textContent = displayKey;

        

        // Send hex code to C++ app

        const hexCode = keyToHex(k);

        if (configKey) {

          sendConfigUpdate(configKey, hexCode);

        }

        finish();

      }

      

      function onDown(e) {

        if (e.target !== el) {

          e.preventDefault();

          const displayKey = MBTAG[e.button] || ('MB' + (e.button + 1));

          el.textContent = displayKey;

          

          // Send mouse button code to C++ app

          const hexCode = MBCODE[e.button] || 0x01;

          if (configKey) {

            sendConfigUpdate(configKey, hexCode);

          }

          finish();

        }

      }

      

      function finish() {

        el.classList.remove('listening');

        document.removeEventListener('keydown', onKey, { capture: true });

        document.removeEventListener('mousedown', onDown, { capture: true });

      }

      

      setTimeout(() => {

        document.addEventListener('keydown', onKey, { capture: true });

        document.addEventListener('mousedown', onDown, { capture: true });

      }, 100);

    }



    let activeDdId = null;

    function openDd(triggerEl) {

      const dd = triggerEl.closest('.custom-dd'); if (!dd) return;

      const portalId = dd.dataset.portal; const portal = document.getElementById(portalId); if (!portal) return;

      if (activeDdId && activeDdId !== portalId) { const prev = document.getElementById(activeDdId); if (prev) prev.classList.remove('open'); document.querySelectorAll('.custom-dd.open').forEach(d => d.classList.remove('open')); activeDdId = null; }

      if (portal.classList.contains('open')) { portal.classList.remove('open'); dd.classList.remove('open'); activeDdId = null; return; }

      const rect = triggerEl.getBoundingClientRect();

      portal.style.top = (rect.bottom + 4) + 'px'; portal.style.left = rect.left + 'px'; portal.style.width = rect.width + 'px';

      portal.classList.add('open'); dd.classList.add('open'); activeDdId = portalId;

    }

    /* Set a .dd-selected label without destroying the appended caret icon */
    function setDdLabel(sel, val) {

      if (!sel) return;

      const caret = sel.querySelector('.dd-caret');

      sel.textContent = val;

      if (caret) sel.appendChild(caret);

    }

    function selectDd(ddId, val, itemEl) {

      const dd = document.getElementById(ddId); if (!dd) return;

      const sel = dd.querySelector('.dd-selected'); if (sel) setDdLabel(sel, val);

      const portal = document.getElementById(dd.dataset.portal);

      if (portal) { portal.querySelectorAll('.dd-item').forEach(i => i.classList.toggle('selected', i === itemEl)); portal.classList.remove('open'); }

      dd.classList.remove('open');

      activeDdId = null;

    }

    document.addEventListener('click', e => {

      if (!e.target.closest('.custom-dd') && !e.target.closest('.dd-portal')) { document.querySelectorAll('.dd-portal.open').forEach(p => p.classList.remove('open')); document.querySelectorAll('.custom-dd.open').forEach(d => d.classList.remove('open')); activeDdId = null; }

    });

    let openSbDd = null;

    function toggleSbDd(id) {

      const dd = document.getElementById(id); if (!dd) return;

      if (openSbDd && openSbDd !== id) { const prev = document.getElementById(openSbDd); if (prev) prev.classList.remove('open'); openSbDd = null; }

      if (dd.classList.contains('open')) { dd.classList.remove('open'); openSbDd = null; return; }

      const list = dd.querySelector('.sb-dd-list'); const trig = dd.querySelector('.sb-dd-trigger');

      if (list && trig) { const r = trig.getBoundingClientRect(); list.style.top = (r.bottom + 3) + 'px'; list.style.left = r.left + 'px'; list.style.width = r.width + 'px'; }

      dd.classList.add('open'); openSbDd = id;

    }

    function pickSbDd(ddId, valId, val) {

      const dd = document.getElementById(ddId); const vEl = document.getElementById(valId);

      if (dd) dd.classList.remove('open'); if (vEl) vEl.textContent = val; openSbDd = null;

      const list = document.getElementById(ddId + 'List');

      if (list) list.querySelectorAll('.sb-dd-item').forEach(i => i.classList.toggle('selected', i.textContent.trim() === val));

    }

    function syncProfileDd(val) {

      const dd = document.getElementById('dd-profile'); if (dd) { const sel = dd.querySelector('.dd-selected'); if (sel) setDdLabel(sel, val); }

      const portal = document.getElementById('portal-profile');

      if (portal) portal.querySelectorAll('.dd-item').forEach(i => i.classList.toggle('selected', i.textContent.trim() === val));

    }

    function syncSidebarDd(val) {

      const vEl = document.getElementById('configDdVal'); if (vEl) vEl.textContent = val;

      const list = document.getElementById('configDdList');

      if (list) list.querySelectorAll('.sb-dd-item').forEach(i => i.classList.toggle('selected', i.textContent.trim() === val));

    }



    let _ragePendingNav = null;

    function rageWarnProceed() {
      document.getElementById('rageWarnBackdrop').classList.remove('open');
      if (_ragePendingNav) { _ragePendingNav(); _ragePendingNav = null; }
    }

    function rageWarnCancel() {
      document.getElementById('rageWarnBackdrop').classList.remove('open');
      _ragePendingNav = null;
    }

    /* Legacy menu hand-off: same-origin /legacy keeps whatever host we're on
       (AIM 360° or localhost dev) and carries the ?port= param over;
       file:// falls back to the production URL. */
    function buildLegacyUrl(loc) {
      var q = new URLSearchParams(loc.search);
      var port = q.get('port');
      if (loc.protocol === 'file:')
        return '/' + (port ? '?port=' + encodeURIComponent(port) : '');
      return loc.origin + '/legacy' + (port ? '?port=' + encodeURIComponent(port) : loc.search);
    }

    function openLegacyMenu() {
      location.href = buildLegacyUrl(location);
    }

    function toggleRiskFeatures(el) {
      el.classList.toggle('active');
      const enabled = el.classList.contains('active');
      const navItem = document.getElementById('rageNavItem');
      const sectionLabel = document.getElementById('rageSectionLabel');
      if (navItem) navItem.style.display = enabled ? '' : 'none';
      if (sectionLabel) sectionLabel.style.display = enabled ? '' : 'none';
      localStorage.setItem('phantom_risk_enabled', enabled ? '1' : '0');
      if (!enabled) {
        const activeRage = navItem && navItem.classList.contains('active');
        if (activeRage) {
          navItem.classList.remove('active');
          const combatNav = document.querySelector('[data-tab="combat"]');
          if (combatNav) switchTab('combat', combatNav);
        }
      }
    }

    (function() {
      if (localStorage.getItem('phantom_risk_enabled') === '1') {
        const riskToggle = document.getElementById('riskToggle');
        if (riskToggle) {
          riskToggle.classList.add('active');
          const navItem = document.getElementById('rageNavItem');
          const sectionLabel = document.getElementById('rageSectionLabel');
          if (navItem) navItem.style.display = '';
          if (sectionLabel) sectionLabel.style.display = '';
        }
      }
    })();

    function filterCombatSubtab(btn, sub) {
      const bar = btn.parentElement;
      bar.querySelectorAll('.subtab-pill').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const scroll = document.getElementById('tab-combat').querySelector('.tab-scroll');
      scroll.querySelectorAll('[data-subtab]').forEach(card => {
        const match = (card.getAttribute('data-subtab') || '').split(/\s+/).includes(sub);
        /* `important` so the hide also wins over skin rules like
           `.fov-vis { display:flex !important }`. */
        if (match) card.style.removeProperty('display');
        else card.style.setProperty('display', 'none', 'important');
        if (match && card.classList.contains('card-anim')) {
          card.classList.remove('visible');
          requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('visible')));
        }
      });
      syncFovContext(sub);
    }

    function switchTab(id, navEl) {

      if (id === 'rage') {
        // Show warning first; proceed only on confirmation
        document.getElementById('rageWarnBackdrop').classList.add('open');
        _ragePendingNav = () => _doSwitchTab(id, navEl);
        return;
      }

      _doSwitchTab(id, navEl);

    }

    function _doSwitchTab(id, navEl) {

      document.querySelectorAll('.sb-item').forEach(i => {

        i.classList.remove('active');

        setAuroraOn(i, false);

      });

      if (navEl) {

        navEl.classList.add('active');

        setAuroraOn(navEl, true);

      }

      const currentPane = document.querySelector('.tab-pane.active');

      function showNewPane() {

        document.querySelectorAll('.tab-pane').forEach(p => { p.classList.remove('active', 'entering', 'leaving'); });

        const pane = document.getElementById('tab-' + id);

        if (pane) {

          pane.classList.add('active'); void pane.offsetWidth; pane.classList.add('entering');

          const scroller = pane.querySelector('.tab-scroll');

          if (scroller) { if (scroller._smReset) scroller._smReset(); else scroller.scrollTop = 0; }

          setTimeout(() => pane.classList.remove('entering'), 320);

          pane.querySelectorAll('.card-anim').forEach((c, i) => { c.classList.remove('visible'); setTimeout(() => c.classList.add('visible'), i * 55 + 30); });

        }

        if (id === 'config') fetchCommunityConfigs();

        updateSectionBadge(id);

      }

      if (currentPane && currentPane.id !== 'tab-' + id) {

        currentPane.classList.add('leaving');

        setTimeout(showNewPane, 155);

      } else {

        showNewPane();

      }

    }



    function toggleSidebar() { document.getElementById('sidebar').classList.toggle('collapsed'); }



    const themes = ['dark', 'midnight', 'rose', 'ocean', 'forest', 'ember', 'light'];

    let themeIdx = 0;

    function setTheme(name, btn) {

      document.body.className = document.body.className.replace(/theme-\w+/g, '').trim();

      document.body.classList.add('theme-' + name);

      themeIdx = themes.indexOf(name);

      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));

      if (btn) btn.classList.add('active');

      else document.querySelectorAll('.theme-btn').forEach(b => { if (b.textContent.toLowerCase() === name) b.classList.add('active'); });

      const icon = document.getElementById('themeIcon');

      if (icon) { const m = { dark: 'ri-moon-line', light: 'ri-sun-line', midnight: 'ri-stars-line', rose: 'ri-heart-line', ocean: 'ri-water-flash-line', forest: 'ri-leaf-line', ember: 'ri-fire-line' }; icon.className = m[name] || 'ri-moon-line'; }

      toast('Theme: ' + name[0].toUpperCase() + name.slice(1));

      setTimeout(() => {

        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();

        if (accent && accent.startsWith('#')) {

          const r = parseInt(accent.slice(1, 3), 16), g = parseInt(accent.slice(3, 5), 16), b = parseInt(accent.slice(5, 7), 16);

          updateAuroraColor(r, g, b);

          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          document.body.classList.toggle('light-accent', lum > 165);

          if (window.setSnowColor) setSnowColor(r, g, b);

          const dot = document.getElementById('themeDot');
          if (dot) { dot.style.background = accent; dot.style.boxShadow = '0 0 5px ' + accent; }

          updateRadarAccent(r, g, b);

        }

      }, 0);

    }

    function nextTheme() { themeIdx = (themeIdx + 1) % themes.length; setTheme(themes[themeIdx], null); }



    function updateAccentColor(hex, dotEl) {

      document.documentElement.style.setProperty('--accent', hex);

      const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);

      document.documentElement.style.setProperty('--accent-rgb', `${r},${g},${b}`);

      document.documentElement.style.setProperty('--accent-glow', `rgba(${r},${g},${b},0.28)`);

      document.documentElement.style.setProperty('--accent-light', `rgba(${r},${g},${b},0.11)`);

      updateAuroraColor(r, g, b);

      const sw = document.getElementById('accentSwatch'); if (sw) sw.style.background = hex;

      document.querySelectorAll('.preset-dot').forEach(d => d.classList.remove('active'));

      if (dotEl) dotEl.classList.add('active');

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      document.body.classList.toggle('light-accent', lum > 165);

      if (window.setSnowColor) setSnowColor(r, g, b);

      toast('Accent updated');

    }



    let activeColorMode = 0;

    

    function rgbaToHex(rgba) { const m = rgba.match(/[\d.]+/g); if (!m || m.length < 3) return '#ff4654'; return '#' + [+m[0], +m[1], +m[2]].map(v => v.toString(16).padStart(2, '0')).join(''); }



    // Color Panel Functions

    let cpCallback = null;

    let cpCurrentTarget = null;

    let cpCurrentX = 0;

    let cpCurrentY = 0;

    let cpCurrentHue = 0;



    function openColorPanel(target, initialColor, callback) {

      cpCallback = callback;

      cpCurrentTarget = target;

      const panel = document.getElementById('cpanel');

      const overlay = document.getElementById('cpanelOverlay');

      

      // Parse initial color

      const hex = initialColor.startsWith('#') ? initialColor : '#5a5af5';

      const r = parseInt(hex.slice(1, 3), 16);

      const g = parseInt(hex.slice(3, 5), 16);

      const b = parseInt(hex.slice(5, 7), 16);

      

      // Convert to HSV to set initial position

      const max = Math.max(r, g, b);

      const min = Math.min(r, g, b);

      const v = max / 255;

      const s = max === 0 ? 0 : (max - min) / max;

      let h = 0;

      if (max !== min) {

        if (max === r) h = ((g - b) / (max - min) + 6) % 6;

        else if (max === g) h = (b - r) / (max - min) + 2;

        else h = (r - g) / (max - min) + 4;

      }

      h = h * 60;

      

      cpCurrentHue = h;

      cpCurrentX = s;

      cpCurrentY = 1 - v;

      

      // Update UI

      const hueSlider = document.getElementById('cpHue');

      hueSlider.value = h;

      updateCpHue(h);

      updateCpCursor();

      updateCpPreview();

      

      // Show panel

      overlay.classList.add('open');

      panel.classList.add('open');

      

      // Setup gradient click handler

      const gradient = document.getElementById('cpGradient');

      gradient.onmousedown = cpGradientMouseDown;

    }



    function closeColorPanel() {

      const panel = document.getElementById('cpanel');

      const overlay = document.getElementById('cpanelOverlay');

      overlay.classList.remove('open');

      panel.classList.remove('open');

      cpCallback = null;

      cpCurrentTarget = null;

    }



    function cpGradientMouseDown(e) {

      const gradient = document.getElementById('cpGradient');

      const rect = gradient.getBoundingClientRect();

      

      function updatePos(e) {

        cpCurrentX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

        cpCurrentY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

        updateCpCursor();

        updateCpPreview();

      }

      

      updatePos(e);

      

      function onMove(e) {

        e.preventDefault();

        updatePos(e);

      }

      

      function onUp() {

        document.removeEventListener('mousemove', onMove);

        document.removeEventListener('mouseup', onUp);

      }

      

      document.addEventListener('mousemove', onMove);

      document.addEventListener('mouseup', onUp);

    }



    function updateCpHue(h) {

      cpCurrentHue = h;

      const hueColor = `hsl(${h}, 100%, 50%)`;

      document.documentElement.style.setProperty('--cp-hue', hueColor);

      updateCpPreview();

    }



    function updateCpCursor() {

      const cursor = document.getElementById('cpCursor');

      const gradient = document.getElementById('cpGradient');

      cursor.style.left = (cpCurrentX * 100) + '%';

      cursor.style.top = (cpCurrentY * 100) + '%';

    }



    function updateCpPreview() {

      // Convert HSV to RGB

      const h = cpCurrentHue;

      const s = cpCurrentX;

      const v = 1 - cpCurrentY;

      

      const c = v * s;

      const x = c * (1 - Math.abs(((h / 60) % 2) - 1));

      const m = v - c;

      

      let r, g, b;

      if (h < 60) { r = c; g = x; b = 0; }

      else if (h < 120) { r = x; g = c; b = 0; }

      else if (h < 180) { r = 0; g = c; b = x; }

      else if (h < 240) { r = 0; g = x; b = c; }

      else if (h < 300) { r = x; g = 0; b = c; }

      else { r = c; g = 0; b = x; }

      

      r = Math.round((r + m) * 255);

      g = Math.round((g + m) * 255);

      b = Math.round((b + m) * 255);

      

      const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');

      

      const preview = document.getElementById('cpPreview');

      const hexInput = document.getElementById('cpHex');

      preview.style.background = hex;

      hexInput.value = hex.toUpperCase();

      

      // Call callback if exists

      if (cpCallback) {

        cpCallback(hex);

      }

    }



    function cpHexInput(value) {

      if (!/^#[0-9A-Fa-f]{6}$/.test(value)) return;

      

      const r = parseInt(value.slice(1, 3), 16);

      const g = parseInt(value.slice(3, 5), 16);

      const b = parseInt(value.slice(5, 7), 16);

      

      // Convert RGB to HSV

      const max = Math.max(r, g, b);

      const min = Math.min(r, g, b);

      const v = max / 255;

      const s = max === 0 ? 0 : (max - min) / max;

      let h = 0;

      if (max !== min) {

        if (max === r) h = ((g - b) / (max - min) + 6) % 6;

        else if (max === g) h = (b - r) / (max - min) + 2;

        else h = (r - g) / (max - min) + 4;

      }

      h = h * 60;

      

      cpCurrentHue = h;

      cpCurrentX = s;

      cpCurrentY = 1 - v;

      

      const hueSlider = document.getElementById('cpHue');

      hueSlider.value = h;

      updateCpHue(h);

      updateCpCursor();

      

      const preview = document.getElementById('cpPreview');

      preview.style.background = value;

      

      if (cpCallback) {

        cpCallback(value);

      }

    }



    function cpPickPreset(hex) {

      const hexInput = document.getElementById('cpHex');

      hexInput.value = hex.toUpperCase();

      cpHexInput(hex);

    }



    // Setup hue slider

    document.getElementById('cpHue').addEventListener('input', function(e) {

      updateCpHue(parseFloat(e.target.value));

    });



    let toastT;

    function toast(msg, icon) { const t = document.getElementById('toast'); t.innerHTML = '<i class="ri-' + (icon || 'checkbox-circle-line') + '" style="margin-right:6px;font-size:13px;"></i>' + msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400); }



    // ── License key copy ──
    function copyLicenseKey() {
      const val = document.getElementById('licenseVal');
      const text = val ? val.textContent.trim() : '';
      if (navigator.clipboard && text && !text.includes('•')) {
        navigator.clipboard.writeText(text).then(() => toast('Key copied to clipboard', 'file-copy-line'));
      } else {
        toast('Key copied to clipboard', 'file-copy-line');
      }
    }



    // ── Master Humanization ──
    const MASTER_HUM_SNAP_KEY = 'phantom_masterhum_snapshot';
    let _masterHumSnapshot = null;
    try { _masterHumSnapshot = JSON.parse(localStorage.getItem(MASTER_HUM_SNAP_KEY) || 'null'); } catch (e) { _masterHumSnapshot = null; }

    // Master power: scales every humanization slider proportionally.
    // Base values (the values at master = 1.0) are persisted in localStorage
    // so they survive page refreshes.  displayed = base * power.
    let _humBaseValues = {};
    let _applyingMasterHum = false;
    const HUM_BASE_KEY = 'phantom_hum_base_values';

    function _humSliderRows() {
      return document.querySelectorAll('.slider-row[data-config^="humanization_"]');
    }

    function _saveHumBaseValues() {
      try { localStorage.setItem(HUM_BASE_KEY, JSON.stringify(_humBaseValues)); } catch (e) {}
    }

    function _loadHumBaseValues() {
      try { _humBaseValues = JSON.parse(localStorage.getItem(HUM_BASE_KEY) || '{}'); } catch (e) { _humBaseValues = {}; }
    }

    // Capture current slider values as base (used on first load or after import).
    // If masterPower is provided and != 1, back-calculate: base = displayed / power.
    function _captureHumBaseValues(masterPower) {
      const power = masterPower != null ? parseFloat(masterPower) : 1.0;
      _humBaseValues = {};
      _humSliderRows().forEach(row => {
        const key = row.dataset.config;
        const inp = row.querySelector('input[type=range]');
        if (key && inp) {
          const step = inp.step || '1';
          const isFloat = step.includes('.') || parseFloat(step) < 1;
          const displayed = isFloat ? parseFloat(inp.value) : parseInt(inp.value);
          _humBaseValues[key] = power > 0 ? displayed / power : displayed;
        }
      });
      _saveHumBaseValues();
    }

    function _applyMasterHumPower(power) {
      _applyingMasterHum = true;
      _humSliderRows().forEach(row => {
        const key = row.dataset.config;
        const inp = row.querySelector('input[type=range]');
        if (!key || !inp || !(key in _humBaseValues)) return;
        const step = inp.step || '1';
        const isFloat = step.includes('.') || parseFloat(step) < 1;
        const min = parseFloat(inp.min) || 0;
        const max = parseFloat(inp.max) || 100;
        const base = _humBaseValues[key];
        let scaled = base * power;
        if (isFloat) scaled = Math.round(scaled * 1000) / 1000;
        else scaled = Math.round(scaled);
        scaled = Math.max(min, Math.min(max, scaled));
        inp.value = scaled;
        const sp = row.querySelector('.slider-val');
        if (sp) sp.textContent = isFloat ? parseFloat(scaled.toFixed(2)) : scaled;
        updateLavaFill(inp);
        sendConfigUpdate(key, isFloat ? parseFloat(scaled) : parseInt(scaled));
        refreshModified(row);
      });
      _applyingMasterHum = false;
    }

    // Load persisted base values on boot
    _loadHumBaseValues();
    let _humImportPending = false;

    // Every humanization boolean row on the Humanization tab, keyed by config name
    function _humBoolToggles() {
      const map = {};
      document.querySelectorAll('#tab-humanization .bool-row[data-config^="humanization_"]').forEach(row => {
        const tog = row.querySelector('.checkbox, .switch');
        if (tog && row.dataset.config) map[row.dataset.config] = tog;
      });
      return map;
    }

    function _setMasterHumOffVisual(off) {
      const humTab = document.getElementById('tab-humanization');
      if (humTab) humTab.classList.toggle('hum-master-off', off);
    }

    function _clearMasterHumSnapshot() {
      _masterHumSnapshot = null;
      try { localStorage.removeItem(MASTER_HUM_SNAP_KEY); } catch (e) {}
    }

    function toggleMasterHum(el) {
      const wasOn = el.classList.contains('active');
      el.classList.toggle('active');
      const on = !wasOn;
      const toggles = _humBoolToggles();

      if (!on) {
        // ON → OFF: snapshot current states. Snapshot ONLY on this transition,
        // so double-click spam can never overwrite a good snapshot with all-off.
        const snap = {};
        Object.entries(toggles).forEach(([key, tog]) => { snap[key] = tog.classList.contains('active'); });
        _masterHumSnapshot = snap;
        try { localStorage.setItem(MASTER_HUM_SNAP_KEY, JSON.stringify(snap)); } catch (e) {}
        // Switch every active row off through the normal toggle pathway
        // (row click → toggle() → sendConfigUpdate) so the backend hears it.
        Object.values(toggles).forEach(tog => { if (tog.classList.contains('active')) tog.click(); });
        sendConfigUpdate('humanization_enabled', false);
        sendConfigUpdate('master_humanization_power', 0);
        _setMasterHumOffVisual(true);
      } else {
        // OFF → ON: restore the snapshot through the same pathway
        const snap = _masterHumSnapshot;
        if (snap) {
          Object.entries(toggles).forEach(([key, tog]) => {
            const want = !!snap[key];
            if (tog.classList.contains('active') !== want) tog.click();
          });
        }
        _clearMasterHumSnapshot();
        sendConfigUpdate('humanization_enabled', true);
        const ms = document.getElementById('masterHumSlider');
        if (ms) {
          const power = parseFloat(ms.value);
          sendConfigUpdate('master_humanization_power', power);
          // Re-apply master power to all humanization sliders
          _applyMasterHumPower(power);
        }
        _setMasterHumOffVisual(false);
      }
      toast(on ? 'Humanization enabled' : 'Humanization disabled', on ? 'user-heart-line' : 'user-unfollow-line');
    }

    // A persisted snapshot means the page reloaded while the master was OFF —
    // reflect that state so the first click restores instead of re-snapshotting.
    if (_masterHumSnapshot) {
      const _mhSw = document.getElementById('masterHumSwitch');
      if (_mhSw) _mhSw.classList.remove('active');
      _setMasterHumOffVisual(true);
    }

    function syncMasterHumPower(val) {
      const power = parseFloat(val);
      // Scale every humanization slider from its base value
      _applyMasterHumPower(power);
      // Also sync the master_humanization_power config key
      sendConfigUpdate('master_humanization_power', power);
    }



    // ── Profiles (localStorage) ──
    function _profileKey(slot) { return 'phantom_profile_' + slot; }

    function _refreshProfileMeta(slot) {
      const metaEl = document.getElementById('profile-meta-' + slot);
      const slotEl = document.getElementById('profile-slot-' + slot);
      if (!metaEl) return;
      const raw = localStorage.getItem(_profileKey(slot));
      if (!raw) {
        metaEl.textContent = 'Empty';
        metaEl.style.color = 'var(--sb-dim)';
        if (slotEl) slotEl.classList.remove('has-data');
      } else {
        try {
          const { savedAt } = JSON.parse(raw);
          const d = savedAt ? new Date(savedAt) : null;
          metaEl.textContent = d ? 'Saved ' + d.toLocaleDateString(undefined, { month:'short', day:'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour:'2-digit', minute:'2-digit' }) : 'Saved';
          metaEl.style.color = 'var(--accent)';
          if (slotEl) slotEl.classList.add('has-data');
        } catch(e) {
          metaEl.textContent = 'Saved';
          metaEl.style.color = 'var(--accent)';
        }
      }
    }

    function saveProfile(slot) {
      const nameEl = document.getElementById('profile-name-' + slot);
      const name = nameEl ? nameEl.value.trim() || ('Profile ' + slot) : ('Profile ' + slot);
      const data = {};
      document.querySelectorAll('[data-config]').forEach(el => {
        const key = el.getAttribute('data-config');
        const sw = el.querySelector('.switch, .checkbox');
        const slider = el.querySelector('input[type=range]');
        const dd = el.querySelector('.dd-selected');
        const bind = el.querySelector('.bind-box');
        if (sw) data[key] = { type: 'toggle', active: sw.classList.contains('active') };
        else if (slider) data[key] = { type: 'slider', value: slider.value };
        else if (dd) data[key] = { type: 'dd', value: dd.textContent.trim() };
        else if (bind) data[key] = { type: 'bind', value: bind.textContent.trim() };
      });
      localStorage.setItem(_profileKey(slot), JSON.stringify({ name, data, savedAt: Date.now() }));
      _refreshProfileMeta(slot);
      toast('Saved to "' + name + '"', 'save-line');
    }

    function loadProfile(slot) {
      const raw = localStorage.getItem(_profileKey(slot));
      if (!raw) { toast('Slot ' + slot + ' is empty', 'error-warning-line'); return; }
      try {
        const { name, data } = JSON.parse(raw);
        const nameEl = document.getElementById('profile-name-' + slot);
        if (nameEl && name) nameEl.value = name;
        Object.entries(data).forEach(([key, cfg]) => {
          document.querySelectorAll('[data-config="' + key + '"]').forEach(el => {
            if (cfg.type === 'toggle') {
              const sw = el.querySelector('.switch, .checkbox');
              if (sw) { sw.classList.toggle('active', cfg.active); }
            } else if (cfg.type === 'slider') {
              const inp = el.querySelector('input[type=range]');
              if (inp) { inp.value = cfg.value; updateSlider(inp); }
            } else if (cfg.type === 'dd') {
              const dd = el.querySelector('.dd-selected');
              if (dd) dd.textContent = cfg.value;
            } else if (cfg.type === 'bind') {
              const bind = el.querySelector('.bind-box');
              if (bind) bind.textContent = cfg.value;
            }
          });
        });
        // Mark active slot visually
        document.querySelectorAll('.profile-slot2').forEach(s => s.classList.remove('active-slot'));
        const slotEl = document.getElementById('profile-slot-' + slot);
        if (slotEl) slotEl.classList.add('active-slot');
        toast('Loaded "' + name + '"', 'download-line');
      } catch(e) { toast('Failed to load profile', 'error-warning-line'); }
    }

    function deleteProfile(slot) {
      const raw = localStorage.getItem(_profileKey(slot));
      if (!raw) { toast('Slot ' + slot + ' is already empty', 'information-line'); return; }
      localStorage.removeItem(_profileKey(slot));
      const slotEl = document.getElementById('profile-slot-' + slot);
      if (slotEl) slotEl.classList.remove('active-slot');
      _refreshProfileMeta(slot);
      toast('Slot ' + slot + ' cleared', 'delete-bin-line');
    }

    // Init profile slots on load
    (function() {
      [1,2,3,4].forEach(slot => {
        const nameEl = document.getElementById('profile-name-' + slot);
        if (nameEl) {
          const raw = localStorage.getItem(_profileKey(slot));
          if (raw) { try { const { name } = JSON.parse(raw); if (name) nameEl.value = name; } catch(e) {} }
          nameEl.addEventListener('input', () => {
            const raw2 = localStorage.getItem(_profileKey(slot));
            if (raw2) { try { const obj = JSON.parse(raw2); obj.name = nameEl.value; localStorage.setItem(_profileKey(slot), JSON.stringify(obj)); } catch(e) {} }
          });
        }
        _refreshProfileMeta(slot);
      });
    })();



    function filterNav(q) {

      q = q.toLowerCase();

      document.querySelectorAll('#sbNav .sb-item').forEach(i => { i.style.display = (!q || i.textContent.toLowerCase().includes(q)) ? '' : 'none'; });

      document.querySelectorAll('#sbNav .sb-section-label').forEach(l => { l.style.display = !q ? '' : 'none'; });

    }



    let fxBgEnabled = true, fxEnabledEnabled = true;

    function toggleFxBg(cb) {

      fxBgEnabled = !fxBgEnabled;

      cb.classList.toggle('active', fxBgEnabled);

      const row = cb.closest('.bool-row');

      if (row) { row.classList.toggle('flowing', fxBgEnabled); setAuroraOn(row, fxBgEnabled); }

      const canvas = document.getElementById('bgSnow');

      if (canvas) canvas.style.opacity = fxBgEnabled ? '0.55' : '0';

      toast('Background Effect ' + (fxBgEnabled ? 'On' : 'Off'));

    }

    function toggleFxEnabled(cb) {

      fxEnabledEnabled = !fxEnabledEnabled;

      cb.classList.toggle('active', fxEnabledEnabled);

      const row = cb.closest('.bool-row');

      if (row) row.classList.toggle('flowing', fxEnabledEnabled);

      document.body.classList.toggle('fx-disabled', !fxEnabledEnabled);

      toast('Enabled Effect ' + (fxEnabledEnabled ? 'On' : 'Off'));

    }



    const favTabs = {};

    const tabLabels = { 'combat': 'Combat', 'silent': 'Silent', 'flicker': 'Flicker', 'colors': 'Colors', 'misc': 'Misc', 'config': 'Config', 'radar': 'Radar', 'spike-timer': 'Spike Timer', 'humanization': 'Humanization', 'rage': 'Rage' };

    function toggleTabFav(tabId, btn) {

      if (favTabs[tabId]) { delete favTabs[tabId]; btn.classList.remove('active'); btn.innerHTML = '<i class="ri-star-line"></i> Favorite'; }

      else { favTabs[tabId] = true; btn.classList.add('active'); btn.innerHTML = '<i class="ri-star-fill"></i> Favorited'; toast(tabLabels[tabId] + ' added to Favorites'); }

      renderFavs();

      saveFavoritesToCloud();

    }

    function renderFavs() {

      const empty = document.getElementById('favs-empty'), list = document.getElementById('favs-list');

      const ids = Object.keys(favTabs); empty.style.display = ids.length ? 'none' : 'flex'; list.innerHTML = '';

      ids.forEach((id, i) => {

        const el = document.createElement('div'); el.className = 'fav-entry card-anim'; el.style.transitionDelay = (i * 0.04) + 's';

        el.innerHTML = `<div class="fav-entry-info"><div class="name">${tabLabels[id] || id}</div><div class="section">Tab</div></div><div style="display:flex;align-items:center;gap:7px;"><button style="padding:5px 10px;border-radius:4px;background:var(--accent-light);border:1px solid var(--accent);color:var(--accent);font-size:10.5px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.15s;" onmouseover="this.style.background='var(--accent)';this.style.color='#fff'" onmouseout="this.style.background='var(--accent-light)';this.style.color='var(--accent)'" onclick="goToFavTab('${id}')">Configure</button><i class="ri-star-fill fav-remove-btn" onclick="removeFavTab('${id}')" title="Unpin"></i></div>`;

        list.appendChild(el); setTimeout(() => el.classList.add('visible'), i * 50 + 20);

      });

    }

    function goToFavTab(tabId) { const navEl = document.querySelector(`.sb-item[data-tab="${tabId}"]`); switchTab(tabId, navEl); }

    function removeFavTab(tabId) { delete favTabs[tabId]; const btn = document.getElementById('fav-btn-' + tabId); if (btn) { btn.classList.remove('active'); btn.innerHTML = '<i class="ri-star-line"></i> Favorite'; } renderFavs(); toast(tabLabels[tabId] + ' removed'); }



    document.body.classList.add('theme-dark');

    updateAuroraColor(90, 90, 245);

    document.querySelectorAll('#tab-combat .card-anim').forEach((c, i) => setTimeout(() => c.classList.add('visible'), i * 60 + 60));
    (function() {
      const scroll = document.getElementById('tab-combat').querySelector('.tab-scroll');
      if (!scroll) return;
      scroll.querySelectorAll('[data-subtab]').forEach(card => {
        if ((card.getAttribute('data-subtab') || '').split(/\s+/).includes('aimbot')) card.style.removeProperty('display');
        else card.style.setProperty('display', 'none', 'important');
      });
    })();

    document.querySelectorAll('#tab-dashboard .card-anim,#tab-dashboard .dash-card').forEach((c, i) => setTimeout(() => c.classList.add('visible'), i * 60 + 60));



    (function () {

      const c = document.getElementById('bgSnow'); if (!c) return;

      const ctx = c.getContext('2d');

      let W, H, particles, raf, fr = 90, fg = 90, fb = 245;

      function resize() { W = c.width = window.innerWidth; H = c.height = window.innerHeight; }

      function makeParticles() { particles = []; const count = Math.min(160, Math.floor(W * H / 9000)); for (let i = 0; i < count; i++) { particles.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 2.8 + 0.4, vy: Math.random() * 0.45 + 0.08, vx: (Math.random() - 0.5) * 0.25, o: Math.random() * 0.55 + 0.12 }); } }

      function draw() { ctx.clearRect(0, 0, W, H); ctx.fillStyle = `rgba(${fr},${fg},${fb},1)`; for (let i = 0; i < particles.length; i++) { const p = particles[i]; ctx.globalAlpha = p.o; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill(); p.y += p.vy; p.x += p.vx; if (p.y > H + 4) { p.y = -4; p.x = Math.random() * W; } if (p.x < -4) p.x = W + 4; if (p.x > W + 4) p.x = -4; } ctx.globalAlpha = 1; raf = requestAnimationFrame(draw); }

      window.setSnowColor = function (r, g, b) { fr = r; fg = g; fb = b; };

      resize(); makeParticles(); draw();

      window.addEventListener('resize', () => { resize(); makeParticles(); });

    })();



    // ========== WEBSOCKET CONNECTION TO DESKTOP APP ==========

    let ws = null;

    // Read port and auth token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    let wsPort = parseInt(urlParams.get('port')) || 8081;
    let wsToken = urlParams.get('token') || '';

    let isConnected = false;
    let isAuthenticating = false;

    let heartbeatInterval = null;

    let reconnectTimeout = null;

    let phantomConfig = {};

    let connectionAttempts = 0;

    let connectionTimeoutId = null;

    let hasShownError = false;



    // Add connection status indicator to dashboard

    function updateDashboardConnection() {

      const statusDot = document.querySelector('.status-dot');

      const statusText = document.querySelector('.dash-card:has(.status-dot) span');

      if (statusDot && statusText) {

        if (isConnected) {

          statusDot.style.background = '#4ade80';

          statusText.textContent = 'Active';

          statusText.style.color = '#4ade80';

        } else if (isAuthenticating) {

          statusDot.style.background = '#facc15';

          statusText.textContent = 'Authenticating...';

          statusText.style.color = '#facc15';

        } else {

          statusDot.style.background = '#f87171';

          statusText.textContent = 'Connecting...';

          statusText.style.color = '#f87171';

        }

      }

    }



    function showConnectionError() {
      // Don't reveal the retry button while the boot swipe banner is still on screen —
      // it would show through behind the headline as a grayish bar.
      if (document.getElementById('swipeBanner')) return;
      const ov = document.getElementById('connOverlay');
      if (!ov) { showOverlay(); return; }
      ov.classList.add('conn-fail');
    }

    function showLoadingState() {
      showOverlay();
      const ov = document.getElementById('connOverlay');
      if (ov) ov.classList.remove('conn-fail');
    }

    function hideConnectionError() {
      const ov = document.getElementById('connOverlay');
      if (ov) ov.classList.remove('conn-fail');
      hasShownError = false;
    }



    function retryConnection() {

      hideConnectionError();

      connectionAttempts = 0;

      connectToDesktopApp();

    }



    function connectToDesktopApp() {

      if (ws?.readyState === WebSocket.OPEN) {

        console.log('[AIM 360°] Already connected');

        return;

      }



      if (ws) {

        ws.close();

        ws = null;

      }



      console.log('[AIM 360°] Connecting to ws://localhost:' + wsPort);

      // Show "Connecting..." status before attempting connection
      isAuthenticating = false;
      updateDashboardConnection();

      try {

        // Pass auth token as query param — browsers can't set custom headers on WebSocket
        const wsUrl = wsToken
          ? `ws://localhost:${wsPort}/?token=${encodeURIComponent(wsToken)}`
          : `ws://localhost:${wsPort}`;
        ws = new WebSocket(wsUrl);

        

        // Set timeout to show error if connection fails

        if (connectionTimeoutId) clearTimeout(connectionTimeoutId);

        connectionTimeoutId = setTimeout(() => {

          if (!isConnected) {

            connectionAttempts++;

          }

        }, 3000);

        

        // Show loading state immediately when attempting connection



        ws.onopen = () => {

          console.log('[AIM 360°] WebSocket connected!');

          // Brief "Authenticating..." flash — the server validated our token
          // during the handshake, so onopen means auth succeeded.
          isAuthenticating = true;
          updateDashboardConnection();

          isConnected = true;

          isAuthenticating = false;

          connectionAttempts = 0;

          if (connectionTimeoutId) clearTimeout(connectionTimeoutId);

          updateDashboardConnection();

          // Request current config

          ws.send(JSON.stringify({ type: 'get_config' }));

          // Initialize all default values from UI

          setTimeout(() => {

            initializeDefaultValues();

            updateRadarDisplay();

          }, 500);

          // Switch the rotating browser tab title to the injected phase
          _titlePhase = 'injected';

          toast('Connected to AIM 360° desktop app');

          

          // Start heartbeat

          if (heartbeatInterval) clearInterval(heartbeatInterval);

          heartbeatInterval = setInterval(() => {

            if (ws.readyState === WebSocket.OPEN) {

              ws.send(JSON.stringify({ type: 'heartbeat' }));

            }

          }, 3000);

        };



        ws.onmessage = (event) => {

          try {

            const data = JSON.parse(event.data);

            handleWebSocketMessage(data);

          } catch (e) {

            console.error('[AIM 360°] Failed to parse message:', e);

          }

        };



        ws.onerror = (error) => {

          console.error('[AIM 360°] WebSocket error:', error);

          isConnected = false;

          isAuthenticating = false;

          updateDashboardConnection();

        };



        ws.onclose = (event) => {

          console.log('[AIM 360°] WebSocket closed:', event.code, event.reason);

          isConnected = false;

          isAuthenticating = false;

          updateDashboardConnection();

          

          if (heartbeatInterval) {

            clearInterval(heartbeatInterval);

            heartbeatInterval = null;

          }

          

          // Auto-reconnect after 3 seconds

          if (reconnectTimeout) clearTimeout(reconnectTimeout);

          reconnectTimeout = setTimeout(() => {

            connectionAttempts++;

            const el = document.getElementById('connAttempt');
            if (el) el.textContent = 'localhost:' + wsPort + '  ·  attempt ' + connectionAttempts;

            console.log('[AIM 360°] Attempting to reconnect...');

            connectToDesktopApp();

          }, 3000);

        };

      } catch (error) {

        console.error('[AIM 360°] WebSocket connection error:', error);

        isConnected = false;

        isAuthenticating = false;

        updateDashboardConnection();

      }

    }



    function handleWebSocketMessage(data) {

      switch (data.type) {

        case 'config':

          phantomConfig = data.config;

          updateUIFromConfig(phantomConfig);

          console.log('[AIM 360°] Config received:', phantomConfig);

          setTimeout(updateRadarDisplay, 200);

          if (typeof window.cfgEditorRefresh === 'function') window.cfgEditorRefresh(true);

          break;

        case 'success':

          if (data.message) {

            toast(data.message);

            console.log('[AIM 360°] Success:', data.message);

          }

          break;

        case 'favorites':

          if (data.data) {

            loadFavoritesFromCloud(data.data);

            console.log('[AIM 360°] Favorites loaded from cloud');

          }

          break;

        case 'radar_data':

          if (data.dots && Array.isArray(data.dots)) {

            drawRadarDots(data.dots);

          }

          break;

        case 'spike_timer':

          updateSpikeTimerUI(data);

          break;

        case 'error':

          console.error('[AIM 360°] Server error:', data.message);

          toast('Error: ' + data.message);

          break;

        case 'community_configs':
        case 'community_favs':

          handleCommunityMessage(data.type, data);

          break;

        case 'diagnostic_status': {
          const action = data.action || '';
          const status = data.status || '';
          if (action === 'mouse_test') {
            const btn = document.getElementById('diag-mouse-btn');
            if (status === 'running') {
              _setDiagStatus('diag-mouse-status', 'Moving mouse in a square…', 'running');
            } else if (status === 'complete') {
              _setDiagStatus('diag-mouse-status', 'Test complete — mouse movement is working', 'complete');
              toast('Mouse movement test completed', 'checkbox-circle-line');
            } else {
              _setDiagStatus('diag-mouse-status', 'Test failed — check driver connection', 'error');
              toast('Mouse movement test failed', 'error-warning-line');
            }
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
          } else if (action === 'reinstall_ghub') {
            const btn = document.getElementById('diag-ghub-btn');
            if (status === 'running') {
              _setDiagStatus('diag-ghub-status', 'Reinstalling LGHUB…', 'running');
            } else if (status === 'complete') {
              _setDiagStatus('diag-ghub-status', 'LGHUB reinstalled successfully', 'complete');
              toast('LGHUB reinstall completed', 'checkbox-circle-line');
            } else {
              _setDiagStatus('diag-ghub-status', 'Reinstall failed — try running as admin', 'error');
              toast('LGHUB reinstall failed', 'error-warning-line');
            }
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
          }
          break;
        }

      }

    }



    function sendConfigUpdate(key, value) {
      console.log('[AIM 360°] Updating config:', key, '=', value);

      // --- Aim360 backend bridge (ENI) ---
      // The C++ backend persists config via HTTP POST /api/settings as a JSON
      // merge-patch. We also keep the legacy WebSocket message in case any
      // telemetry layer wants to react in real time.
      try {
        // Coerce "true"/"false" strings to real booleans; keep numbers as numbers.
        let v = value;
        if (typeof v === 'string') {
          if      (v === 'true')  v = true;
          else if (v === 'false') v = false;
          else if (v !== '' && !isNaN(Number(v))) v = Number(v);
        }
        const body = {}; body[key] = v;
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }).catch(e => console.warn('[AIM 360°] /api/settings POST failed:', e));
      } catch (e) {
        console.error('[AIM 360°] HTTP config bridge failed:', e);
      }

      try {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'set_config',
            key: key,
            value: String(value)
          }));
        } else {
          console.warn('[AIM 360°] WebSocket not connected (HTTP bridge still fired):', key);
        }
      } catch (error) {
        console.error('[AIM 360°] Failed to send WS config update:', error);
      }
    }



    function updateUIFromConfig(cfg) {
      if (!cfg) return;

      // VK code → display name for bind boxes
      const vkToName = {
        0xA0:'SHIFT', 0xA1:'RSHIFT', 0xA2:'CTRL', 0xA3:'RCTRL', 0xA4:'ALT', 0xA5:'RALT',
        0x14:'CAPSLOCK', 0x20:'SPACE', 0x09:'TAB', 0x0D:'ENTER', 0x1B:'ESCAPE',
        0x08:'BACKSPACE', 0x2E:'DELETE', 0x2D:'INSERT', 0x24:'HOME', 0x23:'END',
        0x21:'PGUP', 0x22:'PGDN', 0x25:'←', 0x26:'↑', 0x27:'→', 0x28:'↓',
        0x01:'MB1', 0x02:'MB2', 0x04:'MB3', 0x05:'MB4', 0x06:'MB5',
        0x70:'F1', 0x71:'F2', 0x72:'F3', 0x73:'F4', 0x74:'F5', 0x75:'F6',
        0x76:'F7', 0x77:'F8', 0x78:'F9', 0x79:'F10', 0x7A:'F11', 0x7B:'F12'
      };
      function vkDisplay(code) {
        const n = parseInt(code);
        if (vkToName[n]) return vkToName[n];
        if (n >= 0x30 && n <= 0x39) return String.fromCharCode(n); // 0-9
        if (n >= 0x41 && n <= 0x5A) return String.fromCharCode(n); // A-Z
        return '0x' + n.toString(16).toUpperCase();
      }
      function isBool(v) { return v === true || v === 1 || v === '1' || v === 'true'; }

      Object.entries(cfg).forEach(([key, rawVal]) => {
        document.querySelectorAll('[data-config="' + key + '"]').forEach(row => {
          const sw     = row.querySelector('.switch, .checkbox');
          const slider = row.querySelector('input[type=range]');
          const bind   = row.querySelector('.bind-box');

          if (sw) {
            sw.classList.toggle('active', isBool(rawVal));
          } else if (slider) {
            const v = parseFloat(rawVal);
            if (!isNaN(v)) {
              slider.value = v;
              updateSlider(slider);
              const sp = row.querySelector('.slider-val');
              if (sp) sp.textContent = v;
            }
          } else if (bind) {
            bind.textContent = vkDisplay(rawVal);
          }
          refreshModified(row);
        });
      });
      refreshAllDependents();
      refreshStatusStrip();

      // ── Special cases ──────────────────────────────────────────────────────────

      // triggerbot_humanize is always on (no UI toggle) — force it enabled
      sendConfigUpdate('triggerbot_humanize', true);

      // humanization_intensity → also drive master hum slider
      if (cfg.humanization_intensity !== undefined) {
        const ms = document.getElementById('masterHumSlider');
        const mv = document.getElementById('masterHumVal');
        const v  = parseFloat(cfg.humanization_intensity);
        if (ms && !isNaN(v)) { ms.value = v; updateSlider(ms); }
        if (mv && !isNaN(v)) mv.textContent = v;
      }

      // humanization_enabled → sync masterHumSwitch (+ tab dim state)
      if (cfg.humanization_enabled !== undefined) {
        const sw = document.getElementById('masterHumSwitch');
        const humOn = isBool(cfg.humanization_enabled);
        if (sw) sw.classList.toggle('active', humOn);
        _setMasterHumOffVisual(!humOn);
      }

      // selected_bodypart → bone dropdown text + offset slider visibility
      if (cfg.selected_bodypart !== undefined) {
        const boneIdx   = parseInt(cfg.selected_bodypart) || 0;
        const boneNames = ['Head','Neck','Chest','Pelvis','Custom'];
        const boneName  = boneNames[boneIdx] || 'Head';
        const ddBone = document.getElementById('dd-bone');
        if (ddBone) { const sel = ddBone.querySelector('.dd-selected'); if (sel) setDdLabel(sel, boneName); }
        setBoneSelection(boneIdx);
      }

      // color_mode → setColorMode (handles dropdown + RGB/HSV arrays)
      if (cfg.color_mode !== undefined) {
        setColorMode(parseInt(cfg.color_mode));
      }

      // double bind visibility
      if (cfg.aimkey_double !== undefined) {
        const r = document.getElementById('aimkey2-row');
        if (r) r.style.display = (cfg.aimkey_double === true || cfg.aimkey_double === 1 || cfg.aimkey_double === '1' || cfg.aimkey_double === 'true') ? '' : 'none';
      }
      if (cfg.assist_aimkey_double !== undefined) {
        const r = document.getElementById('assist_aimkey2-row');
        if (r) r.style.display = (cfg.assist_aimkey_double === true || cfg.assist_aimkey_double === 1 || cfg.assist_aimkey_double === '1' || cfg.assist_aimkey_double === 'true') ? '' : 'none';
      }
      if (cfg.triggerbot_key_double !== undefined) {
        const r = document.getElementById('triggerbot_key2-row');
        if (r) r.style.display = (cfg.triggerbot_key_double === true || cfg.triggerbot_key_double === 1 || cfg.triggerbot_key_double === '1' || cfg.triggerbot_key_double === 'true') ? '' : 'none';
      }

      // aimbot_fov → FOV ring visualizer
      if (cfg.aimbot_fov !== undefined) {
        requestAnimationFrame(updateOffsetMarker);
      }

      // fov_shape → ring border-radius + button state
      if (cfg.fov_shape !== undefined) {
        const shape = parseInt(cfg.fov_shape);
        const ring = document.getElementById('fov_ring');
        if (ring) ring.style.borderRadius = shape === 0 ? '50%' : '4px';
        const circleBtn = document.getElementById('fov-circle-btn');
        const boxBtn    = document.getElementById('fov-box-btn');
        if (circleBtn) circleBtn.classList.toggle('active', shape === 0);
        if (boxBtn)    boxBtn.classList.toggle('active',    shape === 1);
      }

      // theme_name → setTheme
      if (cfg.theme_name !== undefined && typeof setTheme === 'function') {
        const themeBtn = document.querySelector('.theme-btn[onclick*="' + cfg.theme_name + '"]');
        setTheme(cfg.theme_name, themeBtn || null);
      }

      // accent_color → updateAccentColor
      if (cfg.accent_color !== undefined && typeof updateAccentColor === 'function') {
        updateAccentColor(cfg.accent_color);
      }

      // Capture humanization base values if not already stored (first load)
      // or after an import (the imported config becomes the new baseline).
      if (Object.keys(_humBaseValues).length === 0 || _humImportPending) {
        const ms = document.getElementById('masterHumSlider');
        const power = ms ? parseFloat(ms.value) : 1.0;
        _captureHumBaseValues(power);
        _humImportPending = false;
      }

      console.log('[AIM 360°] UI updated from config');
    }



    function initializeDefaultValues() {

      console.log('[AIM 360°] Initializing default values...');

      

      // Send all default toggle states

      document.querySelectorAll('.ctrl-row[data-config] .checkbox, .ctrl-row[data-config] .switch').forEach(el => {

        const row = el.closest('.ctrl-row');

        const configKey = row?.dataset.config;

        if (configKey) {

          const isActive = el.classList.contains('active');

          sendConfigUpdate(configKey, isActive);

        }

      });

      

      // Send all default slider values

      document.querySelectorAll('.ctrl-row[data-config] input[type="range"]').forEach(slider => {

        const row = slider.closest('.ctrl-row');

        const configKey = row?.dataset.config;

        if (configKey) {

          const step = slider.step || '1';
          const isFloat = step.includes('.') || parseFloat(step) < 1;
          sendConfigUpdate(configKey, isFloat ? parseFloat(slider.value) : parseInt(slider.value));

        }

      });

      

      // Send all default keybinds

      document.querySelectorAll('.ctrl-row[data-config] .bind-box').forEach(bindBox => {

        const row = bindBox.closest('.ctrl-row');

        const configKey = row?.dataset.config;

        if (configKey) {

          const keyText = bindBox.textContent.trim();

          const hexCode = keyToHex(keyText);

          sendConfigUpdate(configKey, hexCode);

        }

      });

      

      console.log('[AIM 360°] Default values initialized');

    }



    function updateCloudConfigsList(configs) {

      const list = document.getElementById('configDdList');

      if (list) {

        list.innerHTML = configs.map(name => 

          `<div class="sb-dd-item" onclick="loadCloudConfig('${name}');pickSbDd('configDd','configDdVal','${name}');syncProfileDd('${name}')">${name}</div>`

        ).join('');

      }

    }



    function _getCfgFilename() {
      const el = document.getElementById('cfg-filename-input');
      return (el ? el.value.trim() : '') || 'my_config';
    }

    function exportConfig() {
      const filename = _getCfgFilename() + '.cfg';
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'export_config', filepath: filename }));
        toast('Exported to ' + filename, 'download-line');
      } else {
        toast('Not connected to desktop app', 'error-warning-line');
      }
    }

    function importConfig() {
      const filename = _getCfgFilename() + '.cfg';
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'import_config', filepath: filename }));
        toast('Importing ' + filename + '…', 'upload-line');
        _humImportPending = true;
      } else {
        toast('Not connected to desktop app', 'error-warning-line');
      }
    }



    // ── Diagnostics ──

    function _setDiagStatus(id, text, state) {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.display = 'block';
      el.textContent = text;
      el.style.background = state === 'running' ? 'rgba(250,204,21,0.1)' :
                            state === 'complete' ? 'rgba(74,222,128,0.1)' :
                            state === 'error' ? 'rgba(248,113,113,0.1)' : 'var(--accent-light)';
      el.style.color = state === 'running' ? '#facc15' :
                       state === 'complete' ? '#4ade80' :
                       state === 'error' ? '#f87171' : 'var(--accent)';
    }

    function diagnosticTestMouse() {
      // Aim360: route Test Mouse through HTTP /api/test_mouse so it works even
      // if the telemetry WebSocket isn't connected yet. Mouse strictly flows
      // through the Logitech G HUB backend (there is no SendInput fallback).
      const btn = document.getElementById('diag-mouse-btn');
      if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }
      _setDiagStatus('diag-mouse-status', 'Moving mouse in a square…', 'running');
      fetch('/api/test_mouse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern: 'square', size: 160, steps: 32, countdown_ms: 1200 })
      }).then(r => r.json()).then(res => {
        if (res && res.ok) {
          _setDiagStatus('diag-mouse-status',
            'OK: ' + res.steps_sent + ' moves via ' + res.backend + ' (' + Math.round(res.duration_ms) + ' ms)',
            'complete');
          toast('Mouse test complete');
        } else {
          _setDiagStatus('diag-mouse-status', res && res.error ? res.error : 'test failed', 'error');
          toast('Mouse test failed', 'error-warning-line');
        }
      }).catch(err => {
        _setDiagStatus('diag-mouse-status', 'request failed: ' + err, 'error');
        toast('Mouse test request failed', 'error-warning-line');
      }).finally(() => {
        if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
      });
    }

    function diagnosticReinstallGHub() {
      if (ws?.readyState !== WebSocket.OPEN) {
        toast('Not connected to desktop app', 'error-warning-line');
        return;
      }
      const btn = document.getElementById('diag-ghub-btn');
      if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }
      _setDiagStatus('diag-ghub-status', 'Reinstalling LGHUB…', 'running');
      ws.send(JSON.stringify({ type: 'reinstall_ghub' }));
    }



    function saveFavoritesToCloud() {

      const favList = Object.keys(favTabs).join('|');

      if (ws?.readyState === WebSocket.OPEN) {

        ws.send(JSON.stringify({ type: 'save_favorites', favorites: favList }));

      }

    }



    function loadFavoritesFromCloud(favString) {

      if (!favString) return;

      

      const favList = favString.split('|').filter(f => f);

      

      Object.keys(favTabs).forEach(key => delete favTabs[key]);

      

      favList.forEach(tabId => {

        favTabs[tabId] = true;

        const btn = document.getElementById('fav-btn-' + tabId);

        if (btn) {

          btn.classList.add('active');

          btn.innerHTML = '<i class="ri-star-fill"></i> Favorited';

        }

      });

      

      renderFavs();

    }



    function testMouseDriver() {
      // Aim360: HTTP path, independent of WS. Does a quick jitter burst.
      fetch('/api/test_mouse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern: 'jitter', size: 80, steps: 24, countdown_ms: 300 })
      }).then(r => r.json()).then(res => {
        if (res && res.ok) toast('Driver OK via ' + res.backend);
        else toast('Driver test failed', 'error-warning-line');
      }).catch(() => toast('Driver test request failed', 'error-warning-line'));
    }



    let colorModeTimeout = null;
    let lastColorMode = -1;
    
    function setColorMode(mode) {

      const colorNames = ['Purple (Default)', 'Anti Astra', 'Yellow', 'Red', 'Custom'];

      console.log('[AIM 360°] Color mode changed to:', colorNames[mode]);

      sendConfigUpdate('color_mode', mode);

      

      // Update active color mode

      activeColorMode = mode;

      

      // Show/hide custom color picker

      const customPicker = document.getElementById('custom-color-picker');

      const customInfo = document.getElementById('custom-color-info');

      if (customPicker) {

        customPicker.style.display = mode === 4 ? 'flex' : 'none';

      }

      if (customInfo) {

        customInfo.style.display = mode === 4 ? 'block' : 'none';

      }

      

      toast('Color: ' + colorNames[mode]);

    }
    
    // Helper function to sync both color mode dropdowns
    function syncColorModeDropdowns(mode, displayName) {
      try {
        // Update main color mode dropdown
        const mainDd = document.getElementById('dd-color-mode');
        if (mainDd) {
          const mainSel = mainDd.querySelector('.dd-selected');
          if (mainSel) setDdLabel(mainSel, displayName);
        }
        
        // Update selected state in both portals and close them
        const mainPortal = document.getElementById('portal-colormode');
        if (mainPortal) {
          mainPortal.querySelectorAll('.dd-item').forEach((item, idx) => {
            item.classList.toggle('selected', idx === mode);
          });
          mainPortal.classList.remove('open');
        }
        
        // Reset active dropdown ID
        if (typeof activeDdId !== 'undefined') {
          activeDdId = null;
        }
      } catch (error) {
        console.error('[AIM 360°] Failed to sync color mode dropdowns:', error);
      }
    }

    function applyCustomColor(hex) {

      // Convert hex to RGB

      const r = parseInt(hex.slice(1, 3), 16);

      const g = parseInt(hex.slice(3, 5), 16);

      const b = parseInt(hex.slice(5, 7), 16);

      

      // Convert RGB to HSV

      const rNorm = r / 255;

      const gNorm = g / 255;

      const bNorm = b / 255;

      

      const max = Math.max(rNorm, gNorm, bNorm);

      const min = Math.min(rNorm, gNorm, bNorm);

      const delta = max - min;

      

      let h = 0;

      let s = 0;

      const v = max;

      

      if (delta !== 0) {

        s = delta / max;

        

        if (max === rNorm) {

          h = ((gNorm - bNorm) / delta) % 6;

        } else if (max === gNorm) {

          h = (bNorm - rNorm) / delta + 2;

        } else {

          h = (rNorm - gNorm) / delta + 4;

        }

        

        h = Math.round(h * 60);

        if (h < 0) h += 360;

      }

      

      s = Math.round(s * 100);

      const vPercent = Math.round(v * 100);

      

      // Calculate RGB ranges with tolerance (±20 for each channel)

      const rMin = Math.max(0, r - 20);

      const rMax = Math.min(255, r + 20);

      const gMin = Math.max(0, g - 20);

      const gMax = Math.min(255, g + 20);

      const bMin = Math.max(0, b - 20);

      const bMax = Math.min(255, b + 20);

      

      // Calculate HSV ranges with tolerance (±10 for hue, ±5 for sat/val)

      const hMin = Math.max(0, h - 10);

      const hMax = Math.min(360, h + 10);

      const sMin = Math.max(0, s - 5);

      const sMax = Math.min(100, s + 5);

      const vMin = Math.max(0, vPercent - 5);

      const vMax = Math.min(100, vPercent + 5);

      

      // Update swatch

      document.documentElement.style.setProperty('--custom-color', hex);

      const sw = document.getElementById('customColorSwatch');

      if (sw) sw.style.background = hex;

      

      // Update RGB/HSV display

      const rgbDisplay = document.getElementById('customColorRGB');

      const hsvDisplay = document.getElementById('customColorHSV');

      if (rgbDisplay) rgbDisplay.textContent = `RGB: ${r}, ${g}, ${b}`;

      if (hsvDisplay) hsvDisplay.textContent = `HSV: ${h}°, ${s}%, ${vPercent}%`;

      

      // Send individual array values (the working approach from backup version)

      console.log('[AIM 360°] Applying custom color:', hex, `RGB:${rMin}-${rMax},${gMin}-${gMax},${bMin}-${bMax}`, `HSV:${hMin}-${hMax},${sMin}-${sMax},${vMin}-${vMax}`);

      

      // Send RGB min/max as individual array elements

      sendConfigUpdate('menorRGB0', rMin);

      sendConfigUpdate('menorRGB1', gMin);

      sendConfigUpdate('menorRGB2', bMin);

      sendConfigUpdate('maiorRGB0', rMax);

      sendConfigUpdate('maiorRGB1', gMax);

      sendConfigUpdate('maiorRGB2', bMax);

      

      // Send HSV min/max as individual array elements

      sendConfigUpdate('menorHSV0', hMin);

      sendConfigUpdate('menorHSV1', sMin);

      sendConfigUpdate('menorHSV2', vMin);

      sendConfigUpdate('maiorHSV0', hMax);

      sendConfigUpdate('maiorHSV1', sMax);

      sendConfigUpdate('maiorHSV2', vMax);

      

      toast('Custom color applied');

    }



    let offsetMarkerUpdateScheduled = false;

    

    function setFovShape(shape, btn) {
      document.querySelectorAll('.fov-shape-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const ring = document.getElementById('fov_ring');
      if (ring) ring.style.borderRadius = shape === 0 ? '50%' : '4px';
      sendConfigUpdate('fov_shape', shape);
    }

    /* ── Context-aware FOV visualizer ──────────────────────────
       The one .fov-vis card is shared by the aimbot, aim-assist and
       trigger sub-tabs. fovVisSub tracks which sub-tab currently
       drives it:
         aimbot     → circle/box sized from #ab_fov (1-180°)
         aim-assist → circle/box sized from #assist_fov (1-180°)
         trigger    → forced box, triggerbot_fovX × fovY pixels
                      (200 px window mapped to 150 px on canvas)   */
    let fovVisSub = 'aimbot';

    function _fovPaintBottom(val, unit) {
      const bottom = document.querySelector('.fov-vis .fov-bottom');
      if (!bottom) return;
      if (bottom.dataset.unit !== unit) {
        bottom.dataset.unit = unit;
        bottom.innerHTML = 'FOV: <span id="fov_display"></span>' + (unit === 'deg' ? '&deg;' : ' px');
      }
      const d = document.getElementById('fov_display');
      if (d) d.textContent = val;
    }

    function refreshFovVis(fromSub) {
      /* Cheap guard: slider hookups pass their own sub-tab so moving a
         slider that isn't driving the vis right now does nothing. */
      if (fromSub && fromSub !== fovVisSub) return;
      const ring = document.getElementById('fov_ring');
      if (!ring) return;

      if (fovVisSub === 'trigger') {
        const gx = document.querySelector('[data-config="triggerbot_fovX"] input[type="range"]');
        const gy = document.querySelector('[data-config="triggerbot_fovY"] input[type="range"]');
        const x = gx ? +gx.value : 4;
        const y = gy ? +gy.value : 4;
        const S = 0.75; /* 200 px trigger window -> 150 px on canvas */
        ring.style.width = Math.max(4, x * S) + 'px';
        ring.style.height = Math.max(4, y * S) + 'px';
        ring.style.borderRadius = '4px';
        _fovPaintBottom(x + ' × ' + y, 'px');
        return;
      }

      const src = document.getElementById(fovVisSub === 'aim-assist' ? 'assist_fov' : 'ab_fov');
      const v = src ? +src.value : 35;
      const pct = (Math.min(180, Math.max(1, v)) - 1) / 179;
      const s = 4 + pct * 246;
      ring.style.width = s + 'px';
      ring.style.height = s + 'px';
      const boxBtn = document.getElementById('fov-box-btn');
      ring.style.borderRadius = (boxBtn && boxBtn.classList.contains('active')) ? '4px' : '50%';
      _fovPaintBottom(v, 'deg');
    }

    function syncFovContext(sub) {
      if (sub !== 'aimbot' && sub !== 'aim-assist' && sub !== 'trigger') return;
      fovVisSub = sub;
      const sw = document.querySelector('.fov-vis .fov-shape-switcher');
      if (sw) {
        const show = sub !== 'trigger';
        /* The PHX skin sets `display:flex !important` on the switcher, so
           the hide must carry `important` priority too. */
        if (show) sw.style.removeProperty('display');
        else sw.style.setProperty('display', 'none', 'important');
        /* The px-seg ink can't measure while hidden — repaint on reveal. */
        if (show && sw._pxPaint) requestAnimationFrame(() => sw._pxPaint(false));
      }
      refreshFovVis();
    }

    /* Initial context: the combat tab boots on the aimbot sub-tab. */
    syncFovContext('aimbot');

    function updateOffsetMarker() {

      if (offsetMarkerUpdateScheduled) return;

      offsetMarkerUpdateScheduled = true;

      

      requestAnimationFrame(() => {

        const marker = document.getElementById('fov_offset_marker');

        const xDisplay = document.getElementById('offset_x_display');

        const yDisplay = document.getElementById('offset_y_display');

        

        if (!marker) {

          offsetMarkerUpdateScheduled = false;

          return;

        }

        

        const offsetXRow = document.getElementById('bone-offset-x');

        const offsetYRow = document.getElementById('bone-offset-y');

        

        if (!offsetXRow || !offsetYRow) {

          offsetMarkerUpdateScheduled = false;

          return;

        }

        

        const xSlider = offsetXRow.querySelector('input[type="range"]');

        const ySlider = offsetYRow.querySelector('input[type="range"]');

        

        if (!xSlider || !ySlider) {

          offsetMarkerUpdateScheduled = false;

          return;

        }

        

        const x = parseFloat(xSlider.value);

        const y = parseFloat(ySlider.value);

        

        // Update display values

        if (xDisplay) xDisplay.textContent = x.toFixed(1);

        if (yDisplay) yDisplay.textContent = y.toFixed(1);

        

        // Position marker (scale offset values to pixels, center is 0,0)

        const scale = 0.8; // Scale factor for visualization

        marker.style.left = `calc(50% + ${x * scale}px)`;

        marker.style.top = `calc(50% + ${y * scale}px)`;

        

        offsetMarkerUpdateScheduled = false;

      });

    }



    // ─────────────────────────────────────────────────────────────────────
    // Player Detection mode toggle (ENI).
    // Switches the C++ backend between the Colorbot (HSV) and YOLO (ONNX)
    // detector live. Also hides/shows the two mode-specific sub-controls so
    // the panel only shows the knobs that actually apply to the active mode.
    // ─────────────────────────────────────────────────────────────────────
    function setDetectMode(idx) {
      const modes = ['Colorbot', 'YOLO'];
      const label = modes[idx] || 'Colorbot';
      console.log('[AIM 360°] Detect mode changed to:', label);
      // Backend accepts the string form directly; the api_routes bridge also
      // accepts numeric for compatibility.
      sendConfigUpdate('detect_mode', label);

      const colorRow  = document.getElementById('dm-colorbot-only');
      const smoothRow = document.getElementById('dm-colorbot-smooth');
      const confRow   = document.getElementById('dm-yolo-conf');
      const isYolo    = idx === 1;
      if (colorRow)  colorRow.style.display  = isYolo ? 'none' : '';
      if (smoothRow) smoothRow.style.display = isYolo ? 'none' : '';
      if (confRow)   confRow.style.display   = isYolo ? '' : 'none';

      try { toast('Detection: ' + label, isYolo ? 'brain-line' : 'palette-line'); } catch(e) {}
    }

    function setBoneSelection(boneIndex) {

      console.log('[AIM 360°] Bone selection changed to:', boneIndex);

      sendConfigUpdate('selected_bodypart', boneIndex);
      

      const offsetX = document.getElementById('bone-offset-x');

      const offsetY = document.getElementById('bone-offset-y');

      const marker = document.getElementById('fov_offset_marker');

      

      if (boneIndex === 4) {

        // Custom bone - show offset sliders and marker

        if (offsetX) offsetX.classList.add('bone-visible');

        if (offsetY) offsetY.classList.add('bone-visible');

        if (marker) marker.style.display = 'block';

        updateOffsetMarker();

      } else {

        // Preset bone - hide offset sliders and marker

        if (offsetX) offsetX.classList.remove('bone-visible');

        if (offsetY) offsetY.classList.remove('bone-visible');

        if (marker) marker.style.display = 'none';

        

        const presets = [

          {x: 1, y: 3},

          {x: 1, y: 8.8},

          {x: 1, y: 25},

          {x: 1, y: 40}

        ];

        

        if (presets[boneIndex]) {

          sendConfigUpdate('head_offset_x', presets[boneIndex].x);

          sendConfigUpdate('head_offset_y', presets[boneIndex].y);

        }

      }

    }



    function unloadPhantom() {

      const app = document.getElementById('app');

      const snow = document.getElementById('bgSnow');

      

      // Send unload message to backend to close the .exe

      if (ws?.readyState === WebSocket.OPEN) {

        ws.send(JSON.stringify({ type: 'unload' }));

      }

      

      // Create unload overlay

      const overlay = document.createElement('div');

      overlay.style.cssText = `

        position: fixed;

        inset: 0;

        background: radial-gradient(circle at center, rgba(90,90,245,0.3), transparent 70%);

        z-index: 9999;

        opacity: 0;

        transition: opacity 0.8s ease;

        pointer-events: none;

      `;

      document.body.appendChild(overlay);

      

      // Create unload message

      const message = document.createElement('div');

      message.style.cssText = `

        position: fixed;

        top: 50%;

        left: 50%;

        transform: translate(-50%, -50%) scale(0.8);

        z-index: 10000;

        text-align: center;

        opacity: 0;

        transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);

      `;

      message.innerHTML = `

        <div style="

          background: rgba(3,3,8,0.95);

          border: 1px solid rgba(90,90,245,0.3);

          border-radius: 16px;

          padding: 40px 60px;

          box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(90,90,245,0.2);

        ">

          <i class="ri-logout-box-line" style="

            font-size: 48px;

            color: var(--accent);

            display: block;

            margin-bottom: 20px;

          "></i>

          <div style="

            font-size: 24px;

            font-weight: 700;

            color: #fff;

            margin-bottom: 10px;

          ">Unloading AIM 360°</div>

          <div style="

            font-size: 14px;

            color: var(--sb-text);

          ">Closing desktop app...</div>

        </div>

      `;

      document.body.appendChild(message);

      

      // Animate

      setTimeout(() => {

        overlay.style.opacity = '1';

        message.style.opacity = '1';

        message.style.transform = 'translate(-50%, -50%) scale(1)';

      }, 50);

      

      // Fade out app

      setTimeout(() => {

        app.style.transition = 'opacity 0.8s ease, transform 0.8s ease';

        app.style.opacity = '0';

        app.style.transform = 'scale(0.95)';

        if (snow) {

          snow.style.transition = 'opacity 0.8s ease';

          snow.style.opacity = '0';

        }

      }, 600);

      

      // Close WebSocket and redirect

      setTimeout(() => {

        if (ws) ws.close();

        if (heartbeatInterval) clearInterval(heartbeatInterval);

        if (reconnectTimeout) clearTimeout(reconnectTimeout);

        

        toast('AIM 360° unloaded successfully');

        setTimeout(() => {

          window.close();

          setTimeout(() => {

            window.location.href = 'about:blank';

          }, 100);

        }, 500);

      }, 1800);

    }



    // Override the toggle function to send config updates

    const originalToggle = toggle;

    toggle = function(el) {

      originalToggle(el);

      

      const label = el.closest('.ctrl-row')?.querySelector('.ctrl-label')?.textContent;

      const isActive = el.classList.contains('active');

      

      if (label) {

        console.log('[AIM 360°] Toggle:', label, '=', isActive);

      }

    };



    // Override updateSlider to send config updates

    const originalUpdateSlider = updateSlider;

    updateSlider = function(el) {

      originalUpdateSlider(el);

      

      // Send config update for slider changes

      const label = el.closest('.ctrl-row')?.querySelector('.ctrl-label')?.textContent;

      const value = el.value;

      

      if (label) {

        console.log('[AIM 360°] Slider:', label, '=', value);

        // sendConfigUpdate(configKey, value);

      }

    };



    // ========== FULL-SCREEN SWIPE BANNER (boot sequence) ==========
    // Shows a big bold message that swipes in from the right and out to the left.
    function _ensureBannerStyles() {
      if (document.getElementById('swipeBannerStyles')) return;
      const s = document.createElement('style');
      s.id = 'swipeBannerStyles';
      s.textContent = `
        @keyframes swipeInRight{from{transform:translateX(110%);opacity:0;}to{transform:translateX(0);opacity:1;}}
        @keyframes swipeOutLeft{from{transform:translateX(0);opacity:1;}to{transform:translateX(-115%);opacity:0;}}
        @keyframes grainShift{0%{transform:translate(0,0);}10%{transform:translate(-5%,-5%);}20%{transform:translate(-10%,5%);}30%{transform:translate(5%,-10%);}40%{transform:translate(-5%,15%);}50%{transform:translate(-10%,5%);}60%{transform:translate(15%,0%);}70%{transform:translate(0%,10%);}80%{transform:translate(-15%,0%);}90%{transform:translate(10%,5%);}100%{transform:translate(5%,0%);}}
        @keyframes textJitter{0%{clip-path:inset(0 0 0 0);transform:translateX(0);}5%{clip-path:inset(20% 0 60% 0);transform:translateX(-3px);}10%{clip-path:inset(0 0 0 0);transform:translateX(0);}15%{clip-path:inset(80% 0 5% 0);transform:translateX(2px);}20%{clip-path:inset(0 0 0 0);transform:translateX(0);}30%{clip-path:inset(40% 0 40% 0);transform:translateX(-1px);}35%{clip-path:inset(0 0 0 0);transform:translateX(0);}50%{clip-path:inset(10% 0 80% 0);transform:translateX(1px);}55%{clip-path:inset(0 0 0 0);transform:translateX(0);}70%{clip-path:inset(60% 0 20% 0);transform:translateX(-2px);}75%{clip-path:inset(0 0 0 0);transform:translateX(0);}100%{clip-path:inset(0 0 0 0);transform:translateX(0);}}
        @keyframes textFlicker{0%,100%{opacity:1;}3%{opacity:0.7;}6%{opacity:1;}7%{opacity:0.5;}8%{opacity:1;}50%{opacity:1;}52%{opacity:0.8;}54%{opacity:1;}}
        @keyframes scanlineMove{from{transform:translateY(-100%);}to{transform:translateY(100%);}}
        @keyframes chromaticShift{0%,100%{text-shadow:0 2px 30px rgba(0,0,0,0.6),2px 0 0 rgba(255,0,80,0.4),-2px 0 0 rgba(0,200,255,0.4);}25%{text-shadow:0 2px 30px rgba(0,0,0,0.6),-3px 0 0 rgba(255,0,80,0.5),3px 0 0 rgba(0,200,255,0.5);}50%{text-shadow:0 2px 30px rgba(0,0,0,0.6),1px 0 0 rgba(255,0,80,0.3),-1px 0 0 rgba(0,200,255,0.3);}75%{text-shadow:0 2px 30px rgba(0,0,0,0.6),-2px 0 0 rgba(255,0,80,0.4),2px 0 0 rgba(0,200,255,0.4);}}
        #swipeBanner{position:fixed;inset:0;z-index:1000001;display:flex;align-items:center;justify-content:center;
          pointer-events:none;overflow:hidden;}
        .swipe-banner-track{width:100%;text-align:center;transform:translateX(110%);opacity:0;position:relative;}
        .swipe-banner-track.in{animation:swipeInRight 0.5s ease-out forwards;}
        .swipe-banner-track.out{animation:swipeOutLeft 0.5s ease-in forwards;}
        .swipe-banner-text{font-family:'Space Grotesk','Inter',sans-serif;font-weight:800;
          font-size:clamp(28px,7vw,84px);letter-spacing:1px;line-height:1;color:#fff;text-transform:uppercase;
          animation:chromaticShift 3s linear infinite,textFlicker 4s linear infinite;text-shadow:0 2px 30px rgba(0,0,0,0.6);}
        .swipe-banner-text::before{content:attr(data-text);position:absolute;top:0;left:0;width:100%;
          color:#ff0050;opacity:0.5;animation:textJitter 3s steps(1) infinite;mix-blend-mode:screen;}
        .swipe-banner-text::after{content:attr(data-text);position:absolute;top:0;left:0;width:100%;
          color:#00c8ff;opacity:0.5;animation:textJitter 3.5s steps(1) infinite reverse;mix-blend-mode:screen;}
        .swipe-banner-sub{margin-top:14px;font-family:'Inter',sans-serif;font-size:clamp(11px,1.6vw,16px);
          font-weight:600;letter-spacing:5px;text-transform:uppercase;color:rgba(255,255,255,0.5);
          animation:textFlicker 5s linear infinite;}
        .swipe-banner-progress-wrap{width:86%;max-width:520px;margin:36px auto 0;}
        .swipe-banner-status{font-family:'Inter',monospace;font-size:12px;font-weight:600;
          color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;
          font-variant-numeric:tabular-nums;animation:textFlicker 5s linear infinite;}
        .swipe-banner-progress{width:100%;height:6px;background:transparent;
          border:none;overflow:hidden;position:relative;}
        .swipe-banner-progress-fill{height:100%;width:0%;background:var(--accent);
          box-shadow:0 0 12px rgba(var(--accent-rgb),0.6);transition:width 0.3s ease;}
        .swipe-banner-pct{font-family:'Inter',monospace;font-size:13px;font-weight:700;color:#fff;
          margin-top:10px;letter-spacing:1px;font-variant-numeric:tabular-nums;}
        .swipe-banner-grain{position:fixed;inset:-150%;z-index:1000002;pointer-events:none;opacity:0.08;
          background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
          animation:grainShift 0.4s steps(5) infinite;}
        .swipe-banner-scanline{position:fixed;left:0;right:0;height:3px;z-index:1000003;pointer-events:none;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent);
          animation:scanlineMove 3s linear infinite;}`;
      document.head.appendChild(s);
    }
    // Show a swipe banner with the given headline + optional subtext.
    // If holdMs is 'persistent' (string), the banner stays animated and does NOT auto-remove.
    // If withProgress is true, a progress bar + percentage is rendered below the headline.
    function showSwipeBanner(headline, sub, holdMs, withProgress) {
      _ensureBannerStyles();
      // Remove any existing banner first
      const old = document.getElementById('swipeBanner');
      if (old) old.remove();
      const banner = document.createElement('div');
      banner.id = 'swipeBanner';
      const progressHTML = withProgress ? `
          <div class="swipe-banner-progress-wrap">
            <div class="swipe-banner-status" id="bannerStatus">LOADING</div>
            <div class="swipe-banner-progress"><div class="swipe-banner-progress-fill" id="bannerProgressFill"></div></div>
            <div class="swipe-banner-pct" id="bannerPct">0%</div>
          </div>` : '';
      banner.innerHTML = `<div class="swipe-banner-grain"></div><div class="swipe-banner-scanline"></div><div class="swipe-banner-track">
          <div class="swipe-banner-text" data-text="${headline}">${headline}</div>
          ${sub ? `<div class="swipe-banner-sub">${sub}</div>` : ''}
          ${progressHTML}
        </div>`;
      document.body.appendChild(banner);
      const track = banner.querySelector('.swipe-banner-track');
      // Force reflow so the animation restarts cleanly
      void track.offsetWidth;
      track.classList.add('in');
      if (holdMs === 'persistent') {
        // Stay on screen — caller is responsible for dismissing via hideSwipeBanner()
        return banner;
      }
      const total = (holdMs || 1600) + 550; // hold + swipe-in duration
      // Swipe out
      setTimeout(() => {
        track.classList.remove('in');
        void track.offsetWidth;
        track.classList.add('out');
      }, total - 500);
      // Clean up
      setTimeout(() => { if (banner.parentNode) banner.remove(); }, total + 200);
      return banner;
    }

    // Dismiss a persistent swipe banner with the swipe-out animation.
    function hideSwipeBanner() {
      const banner = document.getElementById('swipeBanner');
      if (!banner) return;
      const track = banner.querySelector('.swipe-banner-track');
      if (track) {
        track.classList.remove('in');
        void track.offsetWidth;
        track.classList.add('out');
      }
      setTimeout(() => { if (banner.parentNode) banner.remove(); }, 700);
    }

    // Fake load percentage driver (OG mod-menu style 0→100 fill)
    let _fakeLoadTimer = null;
    function _startFakeLoad() {
      if (_fakeLoadTimer) clearInterval(_fakeLoadTimer);
      let pct = 0;
      const labels = ['LOADING', 'INJECTING', 'INITIALIZING', 'HOOKING', 'FINALIZING'];
      _fakeLoadTimer = setInterval(() => {
        // Slow down as it approaches 90 — waits for real connection to jump to 100
        const inc = pct < 60 ? Math.random() * 8 + 2 : pct < 85 ? Math.random() * 4 + 1 : Math.random() * 1.5;
        pct = Math.min(90, pct + inc);
        const fill = document.getElementById('bannerProgressFill');
        const pctEl = document.getElementById('bannerPct');
        const label = document.getElementById('bannerStatus');
        if (fill) fill.style.width = pct + '%';
        if (pctEl) pctEl.textContent = Math.floor(pct) + '%';
        if (label) label.textContent = labels[Math.min(Math.floor(pct / 20), labels.length - 1)];
      }, 120);
    }
    function _finishFakeLoad() {
      if (_fakeLoadTimer) { clearInterval(_fakeLoadTimer); _fakeLoadTimer = null; }
      const fill = document.getElementById('bannerProgressFill');
      const pctEl = document.getElementById('bannerPct');
      const label = document.getElementById('bannerStatus');
      if (fill) fill.style.width = '100%';
      if (pctEl) pctEl.textContent = '100%';
      if (label) label.textContent = 'COMPLETE';
    }

    // Initialize connection on page load

    // Connection overlay — OG Black Ops 2 mod menu loading vibes
    function showOverlay() {
      let ov = document.getElementById('connOverlay');
      if (ov) { ov.style.display = 'flex'; ov.classList.remove('conn-fail'); ov.classList.add('conn-loading'); return; }
      ov = document.createElement('div');
      ov.id = 'connOverlay';
      ov.className = 'conn-loading';
      ov.innerHTML = `
        <style>
          #connOverlay {
            position:fixed;inset:0;z-index:999999;
            display:flex;align-items:center;justify-content:center;
            background:#000;
            animation:ovFadeIn 0.3s ease both;
          }
          @keyframes ovFadeIn{from{opacity:0}to{opacity:1}}
          @keyframes ovFadeOut{from{opacity:1}to{opacity:0}}

          .conn-box{display:flex;flex-direction:column;align-items:center;width:86%;max-width:520px;}

          .conn-retry-btn{display:none;width:100%;margin-top:28px;padding:11px 20px;
            background:transparent;border:1px solid var(--accent);color:var(--accent);
            font-size:12px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;
            letter-spacing:1px;text-transform:uppercase;transition:all .15s ease;}
          .conn-retry-btn:hover{background:var(--accent);color:#000;}
          #connOverlay.conn-fail .conn-retry-btn{display:block;}
          /* Hide retry button while the boot swipe banner is still on screen */
          body:has(#swipeBanner) #connOverlay .conn-retry-btn{display:none !important;}
        </style>
        <div class="conn-box">
          <button class="conn-retry-btn" onclick="retryConnection()">Retry Connection</button>
        </div>`;
      document.body.appendChild(ov);
    }

    function hideOverlay() {
      const ov = document.getElementById('connOverlay');
      if (!ov) return;
      ov.classList.remove('conn-fail');
      _finishFakeLoad();
      ov.style.animation = 'ovFadeOut 0.5s ease 0.7s both';
      setTimeout(() => { ov.style.display = 'none'; }, 1300);
    }

    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(connectToDesktopApp, 400);
    });



    // ========== ROTATING TAB TITLE ==========

    let _titlePhase = 'injected';
    const _titleSets = {
      scanning: ['WE', 'ARE', 'SCANNING', 'YOUR SYSTEM'],
      injected: ['WE', 'ARE', 'KERNEL MODE', 'LEVELUPLABS']
    };
    (function () {
      let i = 0;
      setInterval(() => {
        const set = _titleSets[_titlePhase] || _titleSets.injected;
        document.title = set[i % set.length];
        i++;
      }, 1500);
    })();



    // Cleanup on page unload

    window.addEventListener('beforeunload', () => {

      if (heartbeatInterval) clearInterval(heartbeatInterval);

      if (reconnectTimeout) clearTimeout(reconnectTimeout);

    });



    // Session uptime counter
    (function() {
      const start = Date.now();
      function pad(n) { return String(n).padStart(2, '0'); }
      setInterval(() => {
        const el = document.getElementById('sessionUptime');
        if (!el) return;
        const s = Math.floor((Date.now() - start) / 1000);
        el.textContent = pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s % 3600 / 60)) + ':' + pad(s % 60);
      }, 1000);
    })();

    // Live clock
    (function() {
      const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      function pad(n) { return String(n).padStart(2, '0'); }
      function tick() {
        const now = new Date();
        const clock = document.getElementById('dashClock');
        const date  = document.getElementById('dashDate');
        if (clock) clock.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
        if (date)  date.textContent  = days[now.getDay()] + ', ' + months[now.getMonth()] + ' ' + now.getDate() + ' ' + now.getFullYear();
      }
      tick();
      setInterval(tick, 1000);
    })();

    // Time-based greeting
    (function() {
      function setGreeting() {
        const h = new Date().getHours();
        const el = document.getElementById('dashGreeting');
        if (!el) return;
        el.textContent = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
      }
      setGreeting();
      setInterval(setGreeting, 60000);
    })();

    // Sidebar accordion toggle
    function toggleSection(label) {
      const items = label.nextElementSibling;
      if (!items || !items.classList.contains('sb-section-items')) return;
      const collapsed = items.classList.toggle('collapsed');
      label.classList.toggle('sec-collapsed', collapsed);
    }

    // Radar scan line matches accent
    function updateRadarAccent(r, g, b) {
      const line = document.getElementById('radar-scan-line');
      if (!line) return;
      line.style.background = `linear-gradient(90deg, transparent 0%, rgba(${r},${g},${b},0.18) 28%, rgba(${r},${g},${b},0.85) 62%, rgba(${r},${g},${b},0.55) 100%)`;
      line.style.filter = `drop-shadow(0 0 9px rgba(${r},${g},${b},0.6))`;
    }

    // Detections counter flash on increment
    (function() {
      const detEl = document.getElementById('radar-detections');
      if (!detEl) return;
      const numEl = detEl.querySelector('span:last-child');
      if (!numEl) return;
      let last = parseInt(numEl.textContent) || 0;
      new MutationObserver(() => {
        const now = parseInt(numEl.textContent) || 0;
        if (now > last) {
          numEl.classList.remove('det-flash');
          void numEl.offsetWidth;
          numEl.classList.add('det-flash');
        }
        last = now;
      }).observe(numEl, { childList: true, characterData: true, subtree: true });
    })();

    // Slider value flash on change
    document.addEventListener('input', e => {
      if (e.target.type !== 'range') return;
      const row = e.target.closest('.ctrl-row');
      if (!row) return;
      const val = row.querySelector('.slider-val');
      if (!val) return;
      val.classList.remove('slider-val-flash');
      void val.offsetWidth;
      val.classList.add('slider-val-flash');
    });

    // Page section badge — shows which section the active tab belongs to
    const sectionMap = {
      combat: 'Combat',
      rage: 'Rage',
      humanization: 'Advanced', radar: 'Advanced', 'spike-timer': 'Advanced',
      colors: 'System', misc: 'System', config: 'System'
    };

    function updateSectionBadge(tabId) {
      document.querySelectorAll('.page-section-badge').forEach(b => b.remove());
      const section = sectionMap[tabId];
      if (!section) return;
      const pane = document.getElementById('tab-' + tabId);
      if (!pane) return;
      const title = pane.querySelector('.page-title');
      if (!title) return;
      const badge = document.createElement('div');
      badge.className = 'page-section-badge';
      badge.textContent = section;
      title.parentNode.insertBefore(badge, title);
    }

    // Editable username with localStorage persistence + avatar initials
    (function() {
      const input  = document.getElementById('dashUsername');
      const avatar = document.getElementById('dashAvatar');
      if (!input) return;

      function updateAvatar(val) {
        if (!avatar) return;
        const words = val.trim().split(/\s+/);
        avatar.textContent = words.length >= 2
          ? (words[0][0] + words[1][0]).toUpperCase()
          : val.trim().slice(0, 2).toUpperCase() || 'U';
      }

      const saved = localStorage.getItem('phantom_username');
      if (saved) { input.value = saved; updateAvatar(saved); }
      else updateAvatar(input.value);

      input.addEventListener('input', () => updateAvatar(input.value));
      input.addEventListener('change', () => {
        const val = input.value.trim() || 'User';
        input.value = val;
        localStorage.setItem('phantom_username', val);
        updateAvatar(val);
      });
      input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); });
    })();

    // Features active counter + card dimming + breakdown
    (function() {
      const TOGGLE_LABELS = {
        aimbot_ativo: 'Aimbot', aimassist_ativo: 'Aim Assist', trigger_ativo: 'Trigger',
        rcs_ativo: 'RCS', rage_ativo: 'Rage', flicker_ativo: 'Flicker',
        humanization_ativo: 'Humanization',
        radar_enabled: 'Radar', strafesetting: 'Strafe', bhop_enabled: 'Bhop',
        overclock_timer_resolution: 'Overclock', dodgeflash_ativo: 'Dodge Flash', aimkey_toggle: 'Aim Toggle',
        use_any_game_support: 'Any Game', silent_ativo: 'Silent'
      };

      function updateFeaturesCount() {
        const count = document.querySelectorAll('.switch.active, .checkbox.active').length;
        const countEl = document.getElementById('featuresActiveCount');
        if (countEl) countEl.textContent = count;

        const breakdown = document.getElementById('featBreakdown');
        if (!breakdown) return;
        breakdown.innerHTML = '';
        if (count === 0) {
          breakdown.innerHTML = '<span class="feat-tag-empty">None active</span>';
          return;
        }
        document.querySelectorAll('[data-config] .switch.active, [data-config] .checkbox.active').forEach(tog => {
          const row = tog.closest('[data-config]');
          if (!row) return;
          const key = row.getAttribute('data-config');
          const label = TOGGLE_LABELS[key] || row.querySelector('.ctrl-label')?.textContent?.trim() || key;
          const tag = document.createElement('span');
          tag.className = 'feat-tag';
          tag.textContent = label;
          breakdown.appendChild(tag);
        });
      }

      function syncCardDim(toggle) {
        const card = toggle.closest('.card, .ab-card');
        if (!card) return;
        const firstToggle = card.querySelector('.switch, .checkbox');
        if (firstToggle && (firstToggle === toggle || card.querySelector('.ctrl-row:first-of-type .switch, .ctrl-row:first-of-type .checkbox') === toggle)) {
          card.classList.toggle('card-disabled', !toggle.classList.contains('active'));
        }
      }

      // Observe toggle clicks
      document.addEventListener('click', e => {
        const t = e.target.closest('.switch, .checkbox');
        if (!t) return;
        setTimeout(() => {
          updateFeaturesCount();
          syncCardDim(t);
        }, 0);
      });

      // Init on load
      setTimeout(() => {
        updateFeaturesCount();
        document.querySelectorAll('.card, .ab-card').forEach(card => {
          const firstToggle = card.querySelector('.switch, .checkbox');
          if (firstToggle) card.classList.toggle('card-disabled', !firstToggle.classList.contains('active'));
        });
      }, 100);
    })();

    // Radar functionality

    let radarInterval = null;

    

    function updateRadarDisplay() {

      const radarCheckbox = document.querySelector('[data-config="radar_enabled"] .checkbox');

      

      if (radarCheckbox && radarCheckbox.classList.contains('active')) {

        if (!radarInterval) {

          radarInterval = setInterval(fetchRadarData, 150); // Reduced from 100ms to 150ms for better performance

        }

      } else {

        if (radarInterval) {

          clearInterval(radarInterval);

          radarInterval = null;

          lastRadarData = [];

        }

      }

    }

    

    function fetchRadarData() {

      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      ws.send(JSON.stringify({ type: 'get_radar_data' }));

    }

    // ── Radar Popout ──────────────────────────────────────────────────────────
    let radarPopout = null;

    async function openRadarPopout() {
      if (radarPopout && !radarPopout.closed) { radarPopout.focus(); return; }
      const accentRaw = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff4444';
      const accent = encodeURIComponent(accentRaw);
      const pw = 380, ph = 460;

      // Document Picture-in-Picture: natively always-on-top (Chrome/Edge 116+)
      // Only use PiP if no other popout is already occupying the single PiP slot
      if ('documentPictureInPicture' in window && !documentPictureInPicture.window) {
        try {
          const pipWin = await documentPictureInPicture.requestWindow({
            width: pw, height: ph,
            preferInitialWindowPlacement: true,
          });
          radarPopout = pipWin;
          pipWin.document.documentElement.style.cssText = 'margin:0;padding:0;height:100%;background:#07070d;';
          pipWin.document.body.style.cssText = 'margin:0;padding:0;height:100%;overflow:hidden;';
          const iframe = pipWin.document.createElement('iframe');
          iframe.src = new URL(`/radar-popout.html?port=${wsPort}&accent=${accent}&pip=1`, location.origin).href;
          iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
          pipWin.document.body.appendChild(iframe);
          pipWin.addEventListener('pagehide', () => { radarPopout = null; });
          return;
        } catch(e) { /* user denied or unsupported — fall through */ }
      }

      // Fallback: regular popup (pin button inside will do best-effort focus)
      const sl = Math.round(screen.width / 2 - pw / 2);
      const st = Math.round(screen.height / 2 - ph / 2);
      radarPopout = window.open(
        `/radar-popout.html?port=${wsPort}&accent=${accent}`,
        'AIM 360°Radar',
        `width=${pw},height=${ph},left=${sl},top=${st},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`
      );
      if (!radarPopout) alert('Popout blocked — please allow popups for this page.');
    }

    // ── Spike Timer Popout ────────────────────────────────────────────────────
    let spikePopout = null;

    async function openSpikeTimerPopout() {
      if (spikePopout && !spikePopout.closed) { spikePopout.focus(); return; }
      const accentRaw = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff4444';
      const accent = encodeURIComponent(accentRaw);
      const pw = 180, ph = 110;

      // Place top-right of screen with small margin
      const sl = screen.width - pw - 12;
      const st = 12;

      // Document Picture-in-Picture: natively always-on-top (Chrome/Edge 116+)
      // Only use PiP if no other popout is already occupying the single PiP slot
      if ('documentPictureInPicture' in window && !documentPictureInPicture.window) {
        try {
          const pipWin = await documentPictureInPicture.requestWindow({
            width: pw, height: ph,
            preferInitialWindowPlacement: true,
          });
          spikePopout = pipWin;
          pipWin.document.documentElement.style.cssText = 'margin:0;padding:0;height:100%;background:#07070d;';
          pipWin.document.body.style.cssText = 'margin:0;padding:0;height:100%;overflow:hidden;';
          const iframe = pipWin.document.createElement('iframe');
          iframe.src = new URL(`/spike-timer-popout.html?port=${wsPort}&accent=${accent}&pip=1`, location.origin).href;
          iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
          pipWin.document.body.appendChild(iframe);
          pipWin.addEventListener('pagehide', () => { spikePopout = null; });
          return;
        } catch(e) { /* fall through */ }
      }

      // Fallback: regular popup top-right
      spikePopout = window.open(
        `/spike-timer-popout.html?port=${wsPort}&accent=${accent}`,
        'AIM 360°SpikeTimer',
        `width=${pw},height=${ph},left=${sl},top=${st},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`
      );
      if (!spikePopout) alert('Popout blocked — please allow popups for this page.');
    }

    // ── Keybinds Popout ───────────────────────────────────────────────────────
    let keybindsPopout = null;

    // Track held keys and toggle states for the keybinds popout
    const _heldKeys = new Set();
    // toggleStates tracks the on/off runtime state for toggle-type keybinds (e.g. aim assist)
    // keyed by enableKey (e.g. 'aimassist_ativo') so both K1 and K2 share one state
    const _toggleStates = {};

    (function() {
      function _normalizeKey(k) {
        const m = {
          ' ':'SPACE','Shift':'SHIFT','Control':'CTRL','Alt':'ALT',
          'CapsLock':'CAPSLOCK','Tab':'TAB','Enter':'ENTER','Escape':'ESCAPE',
          'Backspace':'BACKSPACE','Delete':'DELETE','Insert':'INSERT',
          'Home':'HOME','End':'END','PageUp':'PAGEUP','PageDown':'PAGEDOWN',
          'ArrowLeft':'ARROWLEFT','ArrowUp':'ARROWUP','ArrowRight':'ARROWRIGHT',
          'ArrowDown':'ARROWDOWN','PrintScreen':'PRINTSCREEN','ScrollLock':'SCROLLLOCK',
          'Pause':'PAUSE','NumLock':'NUMLOCK',
        };
        if (m[k]) return m[k];
        if (k.length === 1) return k.toUpperCase();
        if (/^F\d{1,2}$/.test(k)) return k;
        return k.toUpperCase();
      }

      // Toggle-type keybind definitions — pressing the key flips their runtime state
      const TOGGLE_BINDS = [
        { config: 'assist_aimkey',  enableKey: 'aimassist_ativo' },
        { config: 'assist_aimkey2', enableKey: 'aimassist_ativo' },
      ];

      function _handleTogglePress(pressedKey) {
        TOGGLE_BINDS.forEach(function(def) {
          const bindEl = document.querySelector('[data-config="' + def.config + '"] .bind-box');
          const key = bindEl ? bindEl.textContent.trim() : null;
          if (!key || key === '—' || key !== pressedKey) return;
          const sw = document.querySelector('[data-config="' + def.enableKey + '"] .checkbox, [data-config="' + def.enableKey + '"] .switch');
          const masterEnabled = sw ? sw.classList.contains('active') : false;
          if (masterEnabled) _toggleStates[def.enableKey] = !_toggleStates[def.enableKey];
        });
      }

      document.addEventListener('keydown', e => {
        if (e.repeat) return;
        const k = _normalizeKey(e.key);
        _heldKeys.add(k);
        _handleTogglePress(k);
      }, true);
      document.addEventListener('keyup', e => { _heldKeys.delete(_normalizeKey(e.key)); }, true);
      document.addEventListener('mousedown', e => {
        const t = MBTAG[e.button];
        if (!t) return;
        _heldKeys.add(t);
        _handleTogglePress(t);
      }, true);
      document.addEventListener('mouseup', e => { const t = MBTAG[e.button]; if (t) _heldKeys.delete(t); }, true);
      window.addEventListener('blur', () => _heldKeys.clear());
    })();

    function getKeybindsData() {
      const KEYBINDS = [
        { config: 'aimkey',          label: 'Aimbot',            section: 'Aimbot',   enableKey: 'aimbot_ativo',        holdable: true  },
        { config: 'aimkey2',         label: 'Aimbot Key 2',      section: 'Aimbot',   enableKey: 'aimbot_ativo',        holdable: true,  doubleKey: 'aimkey_double'         },
        { config: 'assist_aimkey',   label: 'Aim Assist',    section: 'Assist',   enableKey: 'aimassist_ativo',     holdable: false, toggleable: true  },
        { config: 'assist_aimkey2',  label: 'Aim Assist K2', section: 'Assist',   enableKey: 'aimassist_ativo',     holdable: false, toggleable: true,  doubleKey: 'assist_aimkey_double'  },
        { config: 'triggerbot_key',  label: 'Trigger Assist',    section: 'Trigger',  enableKey: 'trigger_ativo',       holdable: true  },
        { config: 'triggerbot_key2', label: 'Trigger Assist K2', section: 'Trigger',  enableKey: 'trigger_ativo',       holdable: true,  doubleKey: 'triggerbot_key_double' },
        { config: 'silent_key',      label: 'Assisted Aim',    section: 'Silent',   enableKey: 'silent_ativo',        holdable: true  },
        { config: 'flicker_key',     label: 'Flicker',       section: 'Flicker',  enableKey: 'flicker_ativo',       holdable: true  },
        { config: 'dodgeflash_key',  label: 'Dodge Flash',   section: 'Misc',     enableKey: 'dodgeflash_ativo',    holdable: true  },
        { config: 'spike_reset_key', label: 'Spike Reset',   section: 'Spike',    enableKey: 'spike_timer_enabled', holdable: false },
      ];
      return KEYBINDS.map(def => {
        const bindEl = document.querySelector('[data-config="' + def.config + '"] .bind-box');
        const key = bindEl ? bindEl.textContent.trim() : '—';
        const sw = document.querySelector('[data-config="' + def.enableKey + '"] .checkbox, [data-config="' + def.enableKey + '"] .switch');
        const masterEnabled = sw ? sw.classList.contains('active') : false;

        let enabled;
        if (def.toggleable) {
          // Reset toggle state if master is turned off
          if (!masterEnabled) _toggleStates[def.enableKey] = false;
          enabled = _toggleStates[def.enableKey] === true;
        } else {
          enabled = masterEnabled;
        }

        // HOLDING: only for hold-type features that are enabled and the key is currently pressed
        const held = def.holdable && enabled && key !== '—' && _heldKeys.has(key);

        let visible = true;
        if (def.doubleKey) {
          const dsw = document.querySelector('[data-config="' + def.doubleKey + '"] .checkbox, [data-config="' + def.doubleKey + '"] .switch');
          visible = dsw ? dsw.classList.contains('active') : false;
        }
        return { label: def.label, section: def.section, key, enabled, held, visible };
      }).filter(item => item.visible);
    }

    async function openKeybindsPopout() {
      if (keybindsPopout && !keybindsPopout.closed) { keybindsPopout.focus(); return; }
      const accentRaw = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#5a5af5';
      const accent = encodeURIComponent(accentRaw);
      const pw = 260, ph = 390;

      if ('documentPictureInPicture' in window && !documentPictureInPicture.window) {
        try {
          const pipWin = await documentPictureInPicture.requestWindow({
            width: pw, height: ph,
            preferInitialWindowPlacement: true,
          });
          keybindsPopout = pipWin;
          pipWin.getKeybindsData = () => getKeybindsData();
          pipWin.document.documentElement.style.cssText = 'margin:0;padding:0;height:100%;background:#07070d;';
          pipWin.document.body.style.cssText = 'margin:0;padding:0;height:100%;overflow:hidden;';
          const iframe = pipWin.document.createElement('iframe');
          iframe.src = new URL(`/keybinds-popout.html?accent=${accent}&pip=1`, location.origin).href;
          iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
          pipWin.document.body.appendChild(iframe);
          pipWin.addEventListener('pagehide', () => { keybindsPopout = null; });
          return;
        } catch(e) { /* user denied or unsupported — fall through */ }
      }

      const sl = Math.round(screen.width / 2 - pw / 2);
      const st = Math.round(screen.height / 2 - ph / 2);
      keybindsPopout = window.open(
        `/keybinds-popout.html?accent=${accent}`,
        'AIM 360°Keybinds',
        `width=${pw},height=${ph},left=${sl},top=${st},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`
      );
      if (!keybindsPopout) alert('Popout blocked — please allow popups for this page.');
    }

    // ── Spike Timer ──────────────────────────────────────────────────────────

    let spikeTimerInterval = null;

    function startSpikeTimerPolling() {
      if (spikeTimerInterval) return;
      spikeTimerInterval = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN)
          ws.send(JSON.stringify({ type: 'get_spike_timer' }));
      }, 100);
    }

    function stopSpikeTimerPolling() {
      if (spikeTimerInterval) { clearInterval(spikeTimerInterval); spikeTimerInterval = null; }
    }

    function manualResetSpike() {
      if (ws && ws.readyState === WebSocket.OPEN)
        ws.send(JSON.stringify({ type: 'reset_spike_timer' }));
    }

    function updateSpikeTimerUI(data) {
      const valEl  = document.getElementById('spike-time-value');
      const lblEl  = document.getElementById('spike-time-label');
      const dotEl  = document.getElementById('spike-status-dot');
      const txtEl  = document.getElementById('spike-status-text');
      if (!valEl) return;

      if (data.active) {
        const t = parseFloat(data.remaining);
        valEl.textContent = t.toFixed(1);
        lblEl.textContent = 'seconds remaining';

        const danger = t <= 10;
        valEl.style.color = danger ? '#f87171' : '#4ade80';
        valEl.style.textShadow = danger
          ? '0 0 28px rgba(248,113,113,0.6)'
          : '0 0 24px rgba(74,222,128,0.5)';

        dotEl.style.background   = danger ? '#f87171' : '#4ade80';
        dotEl.style.boxShadow    = danger
          ? '0 0 10px rgba(248,113,113,0.7)'
          : '0 0 10px rgba(74,222,128,0.6)';
        txtEl.textContent = 'Spike Planted';
        txtEl.style.color = 'var(--text)';
      } else {
        valEl.textContent = '--';
        lblEl.textContent = 'waiting for plant';
        valEl.style.color = '#555';
        valEl.style.textShadow = 'none';
        dotEl.style.background  = '#555';
        dotEl.style.boxShadow   = 'none';
        txtEl.textContent = 'Idle';
        txtEl.style.color = 'var(--sb-dim)';
      }
    }

    // Auto-start polling when spike-timer tab becomes visible
    const _origSwitchTab = typeof switchTab === 'function' ? switchTab : null;
    document.addEventListener('click', (e) => {
      const item = e.target.closest('[data-tab]');
      if (!item) return;
      if (item.dataset.tab === 'spike-timer') startSpikeTimerPolling();
      else stopSpikeTimerPolling();
    }, true);



    function drawRadarDots(dots) {

      const canvas = document.getElementById('radar-canvas');

      if (!canvas) return;

      

      const ctx = canvas.getContext('2d');

      const centerX = canvas.width / 2;

      const centerY = canvas.height / 2;

      const maxRadius = canvas.width / 2 - 20;

      

      // Clear canvas

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      

      // Draw enhanced distance rings with gradient

      for (let i = 1; i <= 4; i++) {

        const ringRadius = (maxRadius / 4) * i;

        const alpha = 0.25 - (i * 0.04);

        

        // Ring glow

        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;

        ctx.lineWidth = 2;

        ctx.shadowBlur = 8;

        ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';

        ctx.beginPath();

        ctx.arc(centerX, centerY, ringRadius, 0, 2 * Math.PI);

        ctx.stroke();

        ctx.shadowBlur = 0;

        

        // Ring line

        ctx.strokeStyle = `rgba(120, 120, 255, ${alpha})`;

        ctx.lineWidth = 1;

        ctx.beginPath();

        ctx.arc(centerX, centerY, ringRadius, 0, 2 * Math.PI);

        ctx.stroke();

      }

      

      // Draw outer border with glow

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';

      ctx.lineWidth = 3;

      ctx.shadowBlur = 15;

      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';

      ctx.beginPath();

      ctx.arc(centerX, centerY, maxRadius, 0, 2 * Math.PI);

      ctx.stroke();

      ctx.shadowBlur = 0;

      

      // Draw enhanced crosshair lines

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';

      ctx.lineWidth = 1.5;

      ctx.setLineDash([5, 5]);

      // Vertical

      ctx.beginPath();

      ctx.moveTo(centerX, centerY - maxRadius);

      ctx.lineTo(centerX, centerY + maxRadius);

      ctx.stroke();

      // Horizontal

      ctx.beginPath();

      ctx.moveTo(centerX - maxRadius, centerY);

      ctx.lineTo(centerX + maxRadius, centerY);

      ctx.stroke();

      ctx.setLineDash([]);

      

      // Draw sound dots with enhanced effects

      const currentTime = Date.now();

      dots.forEach(dot => {

        const angleRad = (dot.angle * Math.PI) / 180;

        const distance = dot.distance * maxRadius;

        

        const x = centerX + Math.sin(angleRad) * distance;

        const y = centerY - Math.cos(angleRad) * distance;



        // Calculate age-based fade

        const age = dot.timestamp ? Math.min(1, (currentTime - dot.timestamp) / 2500) : 0;

        const fadeAlpha = Math.pow(1 - age, 1.5);

        if (fadeAlpha <= 0.05) return;



        const intensity = Math.min(1, Math.max(0, dot.intensity));

        

        // Enhanced color scheme - vibrant cyan to red based on intensity

        const hue = 0; // 180 (cyan) to 0 (red)

        const sat = 85 + (intensity * 15);

        const light = 55 + (intensity * 10);

        

        // Draw expanding ripple effect for new dots

        if (age < 0.3) {

          const rippleSize = 15 + (age * 40);

          const rippleAlpha = (0.3 - age) * fadeAlpha;

          ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, ${rippleAlpha * 0.6})`;

          ctx.lineWidth = 2;

          ctx.beginPath();

          ctx.arc(x, y, rippleSize, 0, 2 * Math.PI);

          ctx.stroke();

        }

        

        // Draw large outer glow

        const glowSize = 18 + intensity * 8;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);

        gradient.addColorStop(0, `hsla(${hue}, ${sat}%, ${light}%, ${0.5 * fadeAlpha})`);

        gradient.addColorStop(0.5, `hsla(${hue}, ${sat}%, ${light}%, ${0.2 * fadeAlpha})`);

        gradient.addColorStop(1, `hsla(${hue}, ${sat}%, ${light}%, 0)`);

        ctx.fillStyle = gradient;

        ctx.beginPath();

        ctx.arc(x, y, glowSize, 0, 2 * Math.PI);

        ctx.fill();



        // Draw main dot with shadow

        const size = 5 + intensity * 3;

        ctx.shadowBlur = 12;

        ctx.shadowColor = `hsla(${hue}, ${sat}%, ${light}%, ${0.8 * fadeAlpha})`;

        ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, ${fadeAlpha})`;

        ctx.beginPath();

        ctx.arc(x, y, size, 0, 2 * Math.PI);

        ctx.fill();

        ctx.shadowBlur = 0;



        // Draw bright center

        ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * fadeAlpha})`;

        ctx.beginPath();

        ctx.arc(x, y, size * 0.35, 0, 2 * Math.PI);

        ctx.fill();

        

        // Draw directional indicator line for close sounds

        if (distance < maxRadius * 0.4 && intensity > 0.5) {

          ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light + 20}%, ${0.4 * fadeAlpha})`;

          ctx.lineWidth = 2;

          ctx.beginPath();

          ctx.moveTo(centerX, centerY);

          ctx.lineTo(x, y);

          ctx.stroke();

        }

      });

    }

    

    // Override toggle to handle radar display

    const _originalToggle = toggle;

    window.toggle = function(el) {

      _originalToggle(el);

      const row = el.closest('.ctrl-row');

      if (row && row.dataset.config === 'radar_enabled') {

        setTimeout(updateRadarDisplay, 100);

      }

    };



    // MP3 Analysis Function

    async function analyzeMp3File(input) {

      const file = input.files[0];

      if (!file) return;



      const resultDiv = document.getElementById('analysis-result');

      const freqDataDiv = document.getElementById('freq-data');

      

      resultDiv.style.display = 'block';

      freqDataDiv.innerHTML = '<div style="color:var(--accent);">Analyzing audio...</div>';



      try {

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        const arrayBuffer = await file.arrayBuffer();

        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        

        // Get audio data

        const channelData = audioBuffer.getChannelData(0);

        const sampleRate = audioBuffer.sampleRate;

        

        // Perform FFT analysis

        const fftSize = 2048;

        const analyser = audioContext.createAnalyser();

        analyser.fftSize = fftSize;

        

        const source = audioContext.createBufferSource();

        source.buffer = audioBuffer;

        source.connect(analyser);

        

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        analyser.getByteFrequencyData(dataArray);

        

        // Find dominant frequencies

        let maxAmplitude = 0;

        let dominantFreqIndex = 0;

        const frequencies = [];

        

        for (let i = 0; i < dataArray.length; i++) {

          const freq = (i * sampleRate) / fftSize;

          if (freq > 20 && freq < 8000) { // Human hearing range

            if (dataArray[i] > maxAmplitude) {

              maxAmplitude = dataArray[i];

              dominantFreqIndex = i;

            }

            if (dataArray[i] > 50) { // Significant amplitude

              frequencies.push({ freq: Math.round(freq), amplitude: dataArray[i] });

            }

          }

        }

        

        const dominantFreq = Math.round((dominantFreqIndex * sampleRate) / fftSize);

        

        // Calculate average intensity

        const avgIntensity = channelData.reduce((sum, val) => sum + Math.abs(val), 0) / channelData.length;

        

        // Detect frequency ranges

        const lowFreqs = frequencies.filter(f => f.freq >= 80 && f.freq <= 400);

        const midFreqs = frequencies.filter(f => f.freq >= 400 && f.freq <= 2000);

        const highFreqs = frequencies.filter(f => f.freq >= 2000 && f.freq <= 6000);

        

        // Display results

        let html = `

          <div><strong>Sample Rate:</strong> ${sampleRate} Hz</div>

          <div><strong>Duration:</strong> ${audioBuffer.duration.toFixed(2)}s</div>

          <div><strong>Dominant Frequency:</strong> ${dominantFreq} Hz</div>

          <div><strong>Average Intensity:</strong> ${(avgIntensity * 100).toFixed(2)}%</div>

          <div style="margin-top:8px;"><strong>Frequency Distribution:</strong></div>

          <div>• Low (80-400 Hz): ${lowFreqs.length} peaks</div>

          <div>• Mid (400-2000 Hz): ${midFreqs.length} peaks</div>

          <div>• High (2000-6000 Hz): ${highFreqs.length} peaks</div>

          <div style="margin-top:8px;padding:8px;background:rgba(90,90,245,0.15);border-radius:4px;">

            <strong>Recommended Settings:</strong><br>

            Min Frequency: ${Math.max(20, dominantFreq - 200)} Hz<br>

            Max Frequency: ${Math.min(8000, dominantFreq + 2000)} Hz<br>

            Sensitivity: ${Math.round(avgIntensity * 1000)}

          </div>

        `;

        

        freqDataDiv.innerHTML = html;

        toast('Audio analysis complete!');

        

      } catch (error) {

        freqDataDiv.innerHTML = `<div style="color:#ff4654;">Error: ${error.message}</div>`;

        console.error('Audio analysis error:', error);

      }

    }



    // Update radar detection count

    function updateRadarDetectionCount(count) {

      const detectionSpan = document.querySelector('#radar-detections span');

      if (detectionSpan) {

        detectionSpan.textContent = count;

      }

    }



    // Override drawRadarDots to update detection count

    const _originalDrawRadarDots = drawRadarDots;

    window.drawRadarDots = function(dots) {

      _originalDrawRadarDots(dots);

      updateRadarDetectionCount(dots.length);

    };



    // Update canvas size

    const canvas = document.getElementById('radar-canvas');

    if (canvas) {

      canvas.width = 450;

      canvas.height = 450;

    }

    // Calculate Distance function for Assisted Aim (matches C# code exactly)
    function calculateDistance(inputId = 'sens-calc-input', resultId = 'calc-result') {
      const input = document.getElementById(inputId);
      const resultDiv = document.getElementById(resultId);
      
      if (!input || !resultDiv) return;
      
      const sens = parseFloat(input.value);
      
      if (isNaN(sens) || sens <= 0.01) {
        resultDiv.style.display = 'block';
        resultDiv.style.background = 'rgba(255, 70, 84, 0.15)';
        resultDiv.style.color = '#ff4654';
        resultDiv.textContent = '⚠️ Sensitivity must be > 0.01';
        return;
      }
      
      // C# formula: distance = 1.07437623 * Math.Pow(InGameSensitivity, -0.9936827126)
      const distance = 1.07437623 * Math.pow(sens, -0.9936827126);
      
      // Send game_sensitivity to backend
      sendConfigUpdate('game_sensitivity', sens);
      
      // Display result
      resultDiv.style.display = 'block';
      resultDiv.style.background = 'var(--accent-light)';
      resultDiv.style.color = 'var(--accent)';
      resultDiv.textContent = `✓ Distance: ${distance.toFixed(3)} (Sens: ${sens})`;
      
      toast(`Distance auto-calculated: ${distance.toFixed(3)}`);
    }

    // ── Share Code ──────────────────────────────────────────────────────────────

    function updateShareCodeCount(ta) {
      const el = document.getElementById('share-code-count');
      if (el) el.textContent = ta.value.length ? ta.value.length + ' chars' : '0 chars';
    }

    function copyShareCode() {
      const ta = document.getElementById('share-code-textarea');
      if (!ta || !ta.value.trim()) { toast('Nothing to copy — generate a code first', 'information-line'); return; }
      navigator.clipboard?.writeText(ta.value.trim()).then(() => {
        const btn = document.getElementById('share-copy-btn');
        if (btn) { btn.innerHTML = '<i class="ri-check-line"></i>'; setTimeout(() => { btn.innerHTML = '<i class="ri-file-copy-line"></i>'; }, 1800); }
        toast('Copied to clipboard', 'file-copy-line');
      }).catch(() => { ta.select(); toast('Select + Ctrl+C to copy', 'information-line'); });
    }

    function generateShareCode() {
      const data = {};
      document.querySelectorAll('[data-config]').forEach(el => {
        const key = el.getAttribute('data-config');
        const sw = el.querySelector('.switch, .checkbox');
        const slider = el.querySelector('input[type=range]');
        const dd = el.querySelector('.dd-selected');
        const bind = el.querySelector('.bind-box');
        if (sw) data[key] = { type: 'toggle', active: sw.classList.contains('active') };
        else if (slider) data[key] = { type: 'slider', value: slider.value };
        else if (dd) data[key] = { type: 'dd', value: dd.textContent.trim() };
        else if (bind) data[key] = { type: 'bind', value: bind.textContent.trim() };
      });
      try {
        const code = btoa(JSON.stringify(data));
        const ta = document.getElementById('share-code-textarea');
        if (ta) { ta.value = code; updateShareCodeCount(ta); }
        navigator.clipboard?.writeText(code).then(() => toast('Code generated & copied', 'qr-code-line')).catch(() => toast('Code generated — click Copy to copy', 'qr-code-line'));
      } catch(e) {
        toast('Failed to generate code', 'error-warning-line');
      }
    }

    function loadShareCode() {
      const ta = document.getElementById('share-code-textarea');
      if (!ta || !ta.value.trim()) { toast('Paste a share code first', 'information-line'); return; }
      try {
        const data = JSON.parse(atob(ta.value.trim()));
        _applyCommunityData(data);
        toast('Config loaded from share code', 'download-2-line');
      } catch(e) {
        toast('Invalid share code', 'error-warning-line');
      }
    }

    // ── Community Configs ────────────────────────────────────────────────────────

    function _applyCommunityData(data) {
      // If the humanization master is OFF, an incoming config wins: silently
      // re-arm the master first so applied values aren't fought or restored over.
      const _msw = document.getElementById('masterHumSwitch');
      if (_msw && !_msw.classList.contains('active')) {
        _msw.classList.add('active');
        _setMasterHumOffVisual(false);
        _clearMasterHumSnapshot();
        sendConfigUpdate('humanization_enabled', true);
      }
      Object.entries(data).forEach(([key, cfg]) => {
        document.querySelectorAll('[data-config="' + key + '"]').forEach(el => {
          if (cfg.type === 'toggle') {
            const sw = el.querySelector('.switch, .checkbox');
            if (sw) {
              const wasActive = sw.classList.contains('active');
              if (wasActive !== cfg.active) sw.click();
            }
          } else if (cfg.type === 'slider') {
            const inp = el.querySelector('input[type=range]');
            const sp = el.querySelector('.slider-val');
            if (inp) { inp.value = cfg.value; updateSlider(inp); }
            if (sp) sp.textContent = parseFloat(cfg.value);
          } else if (cfg.type === 'bind') {
            const bind = el.querySelector('.bind-box');
            if (bind) bind.textContent = cfg.value;
          }
        });
      });
    }

    // ── Community Configs — fully backend-driven via KeyAuth global variable ─────

    let _communityConfigs = [];   // populated from backend, never hardcoded
    let _communityFavs    = [];   // synced to KeyAuth per-user variable
    let _communityFilter  = 'all';
    let _communityLoaded  = false;

    // ── Favs — stored in KeyAuth user variable, not localStorage ────────────────

    function _syncFavsToBackend() {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'save_community_favs', favs: JSON.stringify(_communityFavs) }));
      }
    }

    function toggleCommunityFav(idx) {
      const pos = _communityFavs.indexOf(idx);
      if (pos === -1) _communityFavs.push(idx); else _communityFavs.splice(pos, 1);
      _syncFavsToBackend();
      renderCommunityConfigs();
    }

    // ── Fetch from backend ───────────────────────────────────────────────────────

    function fetchCommunityConfigs() {
      const list = document.getElementById('community-list');
      if (list) list.innerHTML = '<div class="community-empty" style="opacity:0.5;">Loading...</div>';
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'get_community_configs' }));
        ws.send(JSON.stringify({ type: 'get_community_favs' }));
      } else {
        if (list) list.innerHTML = '<div class="community-empty">Not connected to backend</div>';
      }
    }

    // ── Inbound WebSocket handlers (hooked into existing message dispatcher) ────
    // Call this from the existing ws onmessage handler for new message types

    function handleCommunityMessage(type, data) {
      if (type === 'community_configs') {
        _communityConfigs = Array.isArray(data.configs) ? data.configs : [];
        _communityLoaded = true;
        renderCommunityConfigs();
        return true;
      }
      if (type === 'community_favs') {
        try { _communityFavs = JSON.parse(data.favs || '[]'); } catch { _communityFavs = []; }
        renderCommunityConfigs();
        return true;
      }
      return false;
    }

    // ── Filter ───────────────────────────────────────────────────────────────────

    function setCommunityFilter(filter, btn) {
      _communityFilter = filter;
      document.querySelectorAll('.community-filter-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      renderCommunityConfigs();
    }

    // ── Render ───────────────────────────────────────────────────────────────────

    const TAG_LABELS = { rage: 'RAGE', legit: 'LEGIT', semi: 'SEMI', misc: 'MISC' };

    function renderCommunityConfigs() {
      const list = document.getElementById('community-list');
      if (!list) return;

      if (!_communityLoaded) {
        list.innerHTML = '<div class="community-empty" style="opacity:0.5;">Loading configs...</div>';
        return;
      }

      let items = _communityConfigs.map((c, i) => ({ ...c, idx: i }));

      if (_communityFilter === 'favs') {
        items = items.filter(c => _communityFavs.includes(c.idx));
      } else if (_communityFilter !== 'all') {
        items = items.filter(c => Array.isArray(c.tags) && c.tags.includes(_communityFilter));
      }

      // Favs float to top
      items.sort((a, b) => (_communityFavs.includes(a.idx) ? 0 : 1) - (_communityFavs.includes(b.idx) ? 0 : 1));

      if (!items.length) {
        list.innerHTML = '<div class="community-empty">' + (_communityFilter === 'favs' ? 'No favourites yet — star a config to save it here' : 'No configs here yet') + '</div>';
        return;
      }

      list.innerHTML = items.map(c => {
        const isFav = _communityFavs.includes(c.idx);
        const tags = Array.isArray(c.tags) ? c.tags : [];
        const tagsHtml = tags.map(t =>
          `<span class="community-tag ${t}">${TAG_LABELS[t] || t.toUpperCase()}</span>`
        ).join('');
        return `
          <div class="community-item">
            <div class="community-item-top">
              <button class="community-fav-btn${isFav ? ' faved' : ''}" onclick="toggleCommunityFav(${c.idx})" title="${isFav ? 'Unfavourite' : 'Favourite'}">
                <i class="ri-star-${isFav ? 'fill' : 'line'}"></i>
              </button>
              <span class="community-item-name">${c.name}</span>
              <span class="community-item-author">by ${c.author || 'unknown'}</span>
            </div>
            <div class="community-item-desc">${c.desc || ''}</div>
            <div class="community-item-bottom">
              ${tagsHtml}
              <button class="community-load-btn" onclick="loadCommunityConfig(${c.idx})">Load</button>
            </div>
          </div>`;
      }).join('');
    }

    function loadCommunityConfig(idx) {
      const cfg = _communityConfigs[idx];
      if (!cfg || !cfg.data) return;
      _applyCommunityData(cfg.data);
      toast('Loaded "' + cfg.name + '"');
    }

    // ── Calculate Dodge Flash Speed based on in-game sensitivity
    // Calibrated at 0.7 sens = speed 11
    function calculateDodgeFlashSpeed() {
      const input = document.getElementById('dodgeflash-sens-input');
      const resultDiv = document.getElementById('dodgeflash-calc-result');

      if (!input || !resultDiv) return;

      const sens = parseFloat(input.value);

      if (isNaN(sens) || sens <= 0) {
        resultDiv.style.display = 'block';
        resultDiv.style.background = 'rgba(255, 70, 84, 0.15)';
        resultDiv.style.color = '#ff4654';
        resultDiv.textContent = '⚠️ Enter a valid sensitivity';
        return;
      }

      const speed = Math.round(Math.min(20, Math.max(1, 11 * (0.7 / sens))));

      // Update the dodgeflash_speed slider and value display
      const row = document.querySelector('.ctrl-row[data-config="dodgeflash_speed"]');
      if (row) {
        const slider = row.querySelector('input[type=range]');
        const valSpan = row.querySelector('.slider-val');
        if (slider) {
          slider.value = speed;
          updateSlider(slider);
        }
        if (valSpan) valSpan.textContent = speed;
      }

      sendConfigUpdate('dodgeflash_speed', speed);

      resultDiv.style.display = 'block';
      resultDiv.style.background = 'var(--accent-light)';
      resultDiv.style.color = 'var(--accent)';
      resultDiv.textContent = `✓ Speed set to ${speed} (Sens: ${sens})`;

      toast(`Dodge Flash speed auto-set to ${speed}`);
    }

    // Fix Aim Assist - Clean and reinstall driver
    function fixAimAssist() {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        toast('⚠️ Not connected to backend');
        return;
      }

      toast('🔧 Cleaning and reinstalling driver...');

      ws.send(JSON.stringify({
        type: 'fix_aimbot'
      }));
    }

  

;


    (function () {
      'use strict';

      const $  = (s, r) => (r || document).querySelector(s);
      const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));

      const mainEl = document.getElementById('mainContent');

      /* ─────────────────────────────────────────────────────────
         1. Navigation model
         ───────────────────────────────────────────────────────── */

      const GROUPS = [
        {
          id: 'combat', label: 'Combat', items: [
            { label: 'Aimbot',                 icon: 'ri-crosshair-2-line',  tab: 'combat', sub: 'aimbot' },
            { label: 'Aim Assist',         icon: 'ri-focus-3-line',      tab: 'combat', sub: 'aim-assist' },
            { label: 'Trigger Assist',         icon: 'ri-flashlight-line',   tab: 'combat', sub: 'trigger' },
            { label: 'Recoil Management',  icon: 'ri-arrow-down-circle-line', tab: 'combat', sub: 'rcs' },
            { label: 'Humanization',       icon: 'ri-brain-line',   tab: 'humanization' }
          ]
        },
        {
          id: 'rage', label: 'Rage', gated: true, items: [
            { label: 'Rage', icon: 'ri-fire-line', tab: 'rage' }
          ]
        },
        {
          id: 'advanced', label: 'Advanced', items: [
            { label: 'Radar',         icon: 'ri-radar-line',       tab: 'radar' },
            { label: 'Spike Timer',   icon: 'ri-timer-flash-line', tab: 'spike-timer' }
          ]
        },
        {
          id: 'system', label: 'Visuals & System', items: [
            { label: 'Colors', icon: 'ri-palette-line',    tab: 'colors' },
            { label: 'Misc',   icon: 'ri-tools-line',      tab: 'misc' },
            { label: 'Config', icon: 'ri-save-line',       tab: 'config' }
          ]
        }
      ];

      const state = { group: null, tab: 'combat', sub: 'aimbot' };

      function rageUnlocked() {
        const el = document.getElementById('rageNavItem');
        return !!el && el.style.display !== 'none';
      }

      function visibleGroups() {
        return GROUPS.filter(g => !g.gated || rageUnlocked());
      }

      function groupOf(tab) {
        return visibleGroups().find(g => g.items.some(i => i.tab === tab)) || null;
      }

      /* ─────────────────────────────────────────────────────────
         2. Sliding indicators
         ───────────────────────────────────────────────────────── */

      /* Slides the white filler onto `target`, stretching across the gap
         and contracting onto the destination.

         Driven by the Web Animations API rather than two CSS transitions
         switched by a timer — a timer can't hit a frame boundary reliably,
         and the mid-flight style change fought the transition already in
         progress. One interpolated animation is smooth by construction. */
      function moveInk(ink, target, animate) {
        if (!ink) return;
        if (!target) {
          ink.style.opacity = '0';
          ink._left = null;
          return;
        }

        const left = target.offsetLeft;
        const width = target.offsetWidth;
        const from = ink._left;
        const fromWidth = ink._width || 0;

        ink.style.opacity = '1';

        /* The combat routes repaint the rail several times per switch.
           A repaint aimed at the spot the bar is already travelling to
           must not cancel that flight — cancelling snapped it to the
           destination instead of sliding. */
        if (from === left && width === ink._width) return;

        if (ink._anim) { ink._anim.cancel(); ink._anim = null; }

        /* Land on the final geometry first, so cancelling the animation
           at any point leaves the bar exactly where it belongs. */
        ink.style.transform = 'translateX(' + left + 'px)';
        ink.style.width = width + 'px';

        if (animate && from != null && from !== left && ink.animate) {
          const near = Math.min(from, left);
          const far = Math.max(from + fromWidth, left + width);

          ink._anim = ink.animate([
            { transform: 'translateX(' + from + 'px)', width: fromWidth + 'px' },
            { transform: 'translateX(' + near + 'px)', width: (far - near) + 'px', offset: .42 },
            { transform: 'translateX(' + left + 'px)', width: width + 'px' }
          ], { duration: 520, easing: 'cubic-bezier(.16, 1, .3, 1)' });
        }

        ink._left = left;
        ink._width = width;
      }

      /* ─────────────────────────────────────────────────────────
         3. Top nav
         ───────────────────────────────────────────────────────── */

      const navEl = $('#pxNav');
      const navInk = document.createElement('span');
      navInk.className = 'px-nav-ink';

      function buildTopNav() {
        if (!navEl) return;
        navEl.innerHTML = '';
        navEl.appendChild(navInk);
        visibleGroups().forEach(g => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'px-tab';
          b.dataset.group = g.id;
          b.textContent = g.label;
          b.addEventListener('click', () => openGroup(g.id, true));
          navEl.appendChild(b);
        });
        paintTopNav(false);
      }

      function paintTopNav(animate) {
        if (!navEl) return;
        let active = null;
        $$('.px-tab', navEl).forEach(b => {
          const on = b.dataset.group === state.group;
          b.classList.toggle('active', on);
          if (on) active = b;
        });
        moveInk(navInk, active, animate !== false);
      }

      /* ─────────────────────────────────────────────────────────
         4. Sub rail
         ───────────────────────────────────────────────────────── */

      const track = $('#pxSubTrack');
      const subInk = $('#pxSubInk');
      const subLabel = $('#pxSubLabel');

      function buildSubRail(groupId, animate) {
        const g = visibleGroups().find(x => x.id === groupId);
        if (!track || !g) return;

        if (subLabel) subLabel.textContent = g.label + ':';
        $$('.px-chip', track).forEach(c => c.remove());

        /* Rebuilt rail — the old position refers to a chip that no longer
           exists, so the filler fades in place instead of travelling. */
        if (subInk) {
          subInk.style.opacity = '0';
          subInk._left = null;
          subInk._width = null;
        }

        g.items.forEach((item, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'px-chip';
          b.dataset.tab = item.tab;
          if (item.sub) b.dataset.sub = item.sub;
          b.innerHTML = '<i class="' + item.icon + '"></i><span>' + item.label + '</span>';
          if (animate) {
            b.classList.add('enter');
            b.style.animationDelay = (i * 45) + 'ms';
            /* drop the class once it lands, so hover/press transforms win again */
            b.addEventListener('animationend', () => {
              b.classList.remove('enter');
              b.style.animationDelay = '';
            }, { once: true });
          }
          b.addEventListener('click', () => goTo(item));
          track.appendChild(b);
        });

        requestAnimationFrame(() => paintSubRail(false));
      }

      function paintSubRail(animate) {
        if (!track) return;
        let active = null;
        $$('.px-chip', track).forEach(c => {
          const on = c.dataset.tab === state.tab &&
                     (!c.dataset.sub || c.dataset.sub === state.sub);
          c.classList.toggle('active', on);
          if (on) active = c;
        });
        moveInk(subInk, active, animate !== false);
      }

      /* ─────────────────────────────────────────────────────────
         5. Navigation actions
         ───────────────────────────────────────────────────────── */

      function openGroup(id, navigate) {
        const g = visibleGroups().find(x => x.id === id);
        if (!g) return;
        if (navigate) { goTo(g.items[0]); return; }
        state.group = id;
        paintTopNav();
        buildSubRail(id, true);
      }

      function goTo(item) {
        if (!item) return;
        const legacy = document.querySelector('.sb-item[data-tab="' + item.tab + '"]');
        if (item.sub) state.sub = item.sub;

        if (state.tab === item.tab) {
          if (item.sub) applySub(item.sub);
          paintSubRail();
          return;
        }
        if (typeof switchTab === 'function') switchTab(item.tab, legacy);
      }

      function applySub(sub) {
        const pill = document.querySelector('#tab-combat .subtab-pill[data-subfilter="' + sub + '"]');
        if (pill && typeof filterCombatSubtab === 'function') filterCombatSubtab(pill, sub);
        state.sub = sub;
        paintSubRail();
      }

      /* ─────────────────────────────────────────────────────────
         6. Sync + transition choreography
         ───────────────────────────────────────────────────────── */

      const scan = $('#pxScan');

      /* One-shot staggered swoop over a container's cards, skipping any
         hidden by the sub-tab filter so the cascade has no gaps.

         Restarting an animation needs the class cleared, a reflow, then
         the class re-added. Doing that once for the whole set — rather
         than per card — keeps every card on the same starting frame. */
      const REDUCED = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      function revealCards(scope, stagger, opts) {
        if (!scope) return;
        opts = opts || {};

        const els = $$('.card-anim, .px-banner', scope)
          .filter(el => el.style.display !== 'none');
        if (!els.length) return;

        /* Stagger by visual position, not DOM order — the masonry
           columns interleave cards, and a cascade that walks one
           column before starting the next reads as two animations. */
        els.sort((a, b) => {
          const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
          return (ra.top - rb.top) || (ra.left - rb.left);
        });

        const gap = (stagger == null ? 30 : stagger) * (REDUCED ? .4 : 1);
        const dur = (opts.duration || 380) * (REDUCED ? .4 : 1);
        const dx = opts.dx || 0;
        const dy = opts.dy == null ? 10 : opts.dy;
        const scale = opts.scale == null ? 1 : opts.scale;

        els.forEach((el, i) => {
          el.classList.add('visible');

          /* Driven imperatively rather than by toggling an animation class.
             A class-based restart depends on the removal, the reflow and the
             re-add all landing correctly, and on no other rule touching the
             same properties — too many ways to silently no-op. element.animate()
             just runs. */
          if (el._pxReveal) { el._pxReveal.cancel(); el._pxReveal = null; }
          if (!el.animate) return;

          el._pxReveal = el.animate([
            { opacity: 0, transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(' + scale + ')' },
            { opacity: 1, offset: .5 },
            { opacity: 1, transform: 'translate(0px, 0px) scale(1)' }
          ], {
            duration: dur,
            delay: i * gap,
            easing: 'cubic-bezier(.16, 1, .3, 1)',
            fill: 'backwards'
          });
        });
      }

      function runScan() {
        if (!scan) return;
        scan.classList.remove('run');
        void scan.offsetWidth;
        scan.classList.add('run');
      }

      function syncTo(tabId) {
        state.tab = tabId;
        const g = groupOf(tabId);
        if (g) {
          const changed = g.id !== state.group;
          state.group = g.id;
          paintTopNav();
          if (changed) buildSubRail(g.id, true);
          else requestAnimationFrame(() => paintSubRail(true));
        }
        syncFav(tabId);
        runScan();
      }

      /* Wrap the real switcher so every entry point — chips, command
         palette, favourites, the rage confirm modal — stays in sync. */
      /* Nav order flattened across groups, so we know which way to slide. */
      function flatOrder() {
        const out = [];
        visibleGroups().forEach(g => g.items.forEach(i => {
          if (out.indexOf(i.tab) < 0) out.push(i.tab);
        }));
        return out;
      }

      function directionTo(id) {
        const order = flatOrder();
        const from = order.indexOf(state.tab);
        const to = order.indexOf(id);
        if (from < 0 || to < 0 || from === to) return 1;
        return to > from ? 1 : -1;
      }

      if (typeof window._doSwitchTab === 'function') {
        const inner = window._doSwitchTab;

        window._doSwitchTab = function (id, legacyEl) {
          const outgoing = document.querySelector('.tab-pane.active');
          const moving = outgoing && outgoing.id !== 'tab-' + id;

          if (moving && mainEl) {
            mainEl.style.setProperty('--px-dx', (directionTo(id) * 26) + 'px');

            /* Dropping `active` here means inner() sees no current pane and
               swaps synchronously instead of waiting out its own 155ms gap.
               We keep the old pane on screen ourselves and animate it out. */
            outgoing.classList.remove('active');
            outgoing.classList.add('px-leaving');
            setTimeout(() => outgoing.classList.remove('px-leaving'), 320);
          }

          const result = inner.call(this, id, legacyEl);

          const pane = document.getElementById('tab-' + id);
          if (pane) {
            /* inner() strips `visible` to replay its per-card cascade — that
               replay is what made every switch look like a page reload. Put
               it back in the same task, before any paint. Its pending timers
               land later as no-ops. */
            $$('.card-anim, .px-banner', pane).forEach(c => c.classList.add('visible'));

            pane.classList.remove('px-enter');
            void pane.offsetWidth;
            pane.classList.add('px-enter');
            setTimeout(() => pane.classList.remove('px-enter'), 620);

            /* Layered: the pane sweeps in horizontally while its cards
               rise a little behind it. Shorter travel and a tight stagger
               so it reads as depth, not a second animation. */
            revealCards(pane, 26, { dy: 13, scale: 1, duration: 500 });
          }

          if (id === 'combat') setTimeout(() => applySub(state.sub), 20);
          syncTo(id);
          return result;
        };
      }

      /* Replaces filterCombatSubtab rather than wrapping it. The original
         re-adds `visible` to every matched card on a double-rAF, which
         lands before any stagger we schedule and flattens it back into a
         single simultaneous fade. */
      let appliedSub = null;

      window.filterCombatSubtab = function (btn, sub) {
        const bar = btn && btn.parentElement;
        if (bar) $$('.subtab-pill', bar).forEach(p => p.classList.remove('active'));
        if (btn) btn.classList.add('active');

        const pane = document.getElementById('tab-combat');
        const scroll = pane && pane.querySelector('.tab-scroll');
        if (!scroll) return;

        /* First run is the initial paint, not a switch — don't replay it. */
        const changed = appliedSub !== null && appliedSub !== sub;

        /* Slide the same way the tabs do: rightward for a later module,
           leftward for an earlier one. */
        const order = (visibleGroups().find(g => g.id === 'combat') || { items: [] })
          .items.filter(i => i.sub).map(i => i.sub);
        const from = order.indexOf(appliedSub);
        const to = order.indexOf(sub);
        const dir = (from < 0 || to < 0 || to === from) ? 1 : (to > from ? 1 : -1);

        appliedSub = sub;

        const shown = [];
        $$('[data-subtab]', scroll).forEach(card => {
          const match = (card.getAttribute('data-subtab') || '').split(/\s+/).includes(sub);
          /* `important` so the hide also wins over skin rules like
             `.fov-vis { display:flex !important }`. */
          if (match) card.style.removeProperty('display');
          else card.style.setProperty('display', 'none', 'important');
          if (match) shown.push(card);
        });

        shown.forEach(c => c.classList.add('visible'));

        /* Rebind what the FOV visualizer represents on this sub-tab. */
        if (typeof syncFovContext === 'function') syncFovContext(sub);

        /* Reuse the tab-switch mechanism verbatim. Switching to Humanization
           animates, so .px-enter on a .tab-pane demonstrably works; anything
           I invent for the sub-tab path is another thing that can be
           outranked. Same class, same element type, same reset sequence. */
        if (changed) {
          if (mainEl) mainEl.style.setProperty('--px-dx', (dir * 44) + 'px');
          pane.classList.remove('px-enter');
          void pane.offsetWidth;
          pane.classList.add('px-enter');
          clearTimeout(pane._pxEnterTimer);
          pane._pxEnterTimer = setTimeout(() => pane.classList.remove('px-enter'), 620);
        }


        state.sub = sub;
        requestAnimationFrame(() => paintSubRail(true));
      };

      /* ─────────────────────────────────────────────────────────
         7. Header actions
         ───────────────────────────────────────────────────────── */

      const searchBtn = $('#pxSearch');
      if (searchBtn) {
        searchBtn.addEventListener('click', () => {
          document.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'k', code: 'KeyK', ctrlKey: true, bubbles: true, cancelable: true
          }));
        });
      }

      /* Typewriter placeholder — cycles suggestions while the palette is
         open and empty, so the search reads as live rather than inert. */
      (function typedPlaceholder() {
        const input = document.getElementById('cmdkInput');
        const backdrop = document.getElementById('cmdkBackdrop');
        if (!input || !backdrop) return;

        const HINTS = [
          'Search settings and tabs…',
          'Try "FOV"',
          'Try "Trigger Assist"',
          'Try "Humanization"',
          'Try "Smooth"',
          'Try "Radar"'
        ];

        let phrase = 0, chars = 0, typing = true, timer = null;

        function frame() {
          const full = HINTS[phrase];

          if (typing) {
            chars++;
            if (chars >= full.length) { typing = false; queue(2000); }
            else queue(52);
          } else {
            chars -= 2;
            if (chars <= 0) {
              chars = 0;
              typing = true;
              phrase = (phrase + 1) % HINTS.length;
              queue(260);
            } else queue(20);
          }

          input.setAttribute('placeholder', full.slice(0, chars) + '▌');
        }

        function queue(ms) { clearTimeout(timer); timer = setTimeout(frame, ms); }

        function start() {
          if (timer || input.value) return;
          chars = 0;
          typing = true;
          frame();
        }

        function stop() {
          clearTimeout(timer);
          timer = null;
        }

        input.addEventListener('input', () => {
          if (input.value) { stop(); input.setAttribute('placeholder', ''); }
          else start();
        });

        /* The palette toggles via a class, so watch for it rather than
           trying to hook the IIFE's private open()/close(). */
        new MutationObserver(() => {
          if (backdrop.classList.contains('open')) start();
          else stop();
        }).observe(backdrop, { attributes: true, attributeFilter: ['class'] });
      })();

      /* Deleted characters detach from the input and tumble away. Each one
         is measured against the input's own font so it starts exactly where
         it sat, then drifts, spins and fades out. */
      (function fallingCharacters() {
        const input = document.getElementById('cmdkInput');
        const row = input && input.closest('.cmdk-input-row');
        const backdrop = document.getElementById('cmdkBackdrop');
        if (!input || !row || !input.animate) return;

        const layer = document.createElement('div');
        layer.className = 'px-fall-layer';
        row.appendChild(layer);

        const ctx = document.createElement('canvas').getContext('2d');
        let previous = input.value;

        function fontOf(el) {
          const cs = getComputedStyle(el);
          return cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' / ' +
                 cs.lineHeight + ' ' + cs.fontFamily;
        }

        function spill(removed, prefix) {
          const cs = getComputedStyle(input);
          const inputBox = input.getBoundingClientRect();
          const rowBox = row.getBoundingClientRect();

          ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;

          const top = inputBox.top - rowBox.top;
          let x = (inputBox.left - rowBox.left) + ctx.measureText(prefix).width;

          Array.prototype.forEach.call(removed, ch => {
            const width = ctx.measureText(ch).width;
            if (ch.trim() === '') { x += width; return; }

            const span = document.createElement('span');
            span.className = 'px-fall';
            span.textContent = ch;
            span.style.font = fontOf(input);
            span.style.left = x + 'px';
            span.style.top = top + 'px';
            span.style.height = inputBox.height + 'px';
            span.style.lineHeight = inputBox.height + 'px';
            layer.appendChild(span);

            /* Deterministic-ish spread from the glyph itself, so repeated
               deletions of the same word don't all fall identically. */
            const seed = ch.charCodeAt(0);
            const drift = ((seed % 13) - 6) * 2.4;
            const spin = ((seed % 17) - 8) * 7;

            const anim = span.animate([
              { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
              { transform: 'translate(' + (drift * .3) + 'px, 4px) rotate(' + (spin * .25) + 'deg)', opacity: .85, offset: .3 },
              { transform: 'translate(' + drift + 'px, 30px) rotate(' + spin + 'deg)', opacity: 0 }
            ], { duration: 540, easing: 'cubic-bezier(.45, 0, .75, 1)', fill: 'forwards' });

            anim.onfinish = () => span.remove();
            anim.oncancel = () => span.remove();

            x += width;
          });
        }

        input.addEventListener('input', () => {
          const now = input.value;

          if (now.length < previous.length) {
            /* Compare from the front so a mid-string delete drops the right
               glyphs, not just the tail. */
            let i = 0;
            while (i < now.length && now[i] === previous[i]) i++;
            const removed = previous.slice(i, i + (previous.length - now.length));
            if (removed) spill(removed, previous.slice(0, i));
          }

          previous = now;
        });

        /* open() clears the field without firing `input` — resync so the
           next keystroke doesn't spill a stale value. */
        if (backdrop) {
          new MutationObserver(() => { previous = input.value; })
            .observe(backdrop, { attributes: true, attributeFilter: ['class'] });
        }
      })();

      const unloadBtn = $('#pxUnload');
      if (unloadBtn) {
        unloadBtn.addEventListener('click', () => {
          if (typeof unloadPhantom === 'function') unloadPhantom();
        });
      }

      /* The star proxies the per-tab favourite button that already
         exists inside each (now hidden) page header. */
      const favBtn = $('#pxFav');

      function syncFav(tabId) {
        if (!favBtn) return;
        const src = document.getElementById('fav-btn-' + tabId);
        favBtn.style.display = src ? '' : 'none';
        if (!src) return;
        const on = src.classList.contains('active');
        favBtn.classList.toggle('active', on);
        favBtn.innerHTML = '<i class="' + (on ? 'ri-star-fill' : 'ri-star-line') + '"></i>';
        favBtn.title = on ? 'Remove from favourites' : 'Favourite this section';
      }

      if (favBtn) {
        favBtn.addEventListener('click', () => {
          const src = document.getElementById('fav-btn-' + state.tab);
          if (src) { src.click(); syncFav(state.tab); }
        });
      }

      /* Connection status chip */
      const statusChip = $('#pxStatus');
      const statusTxt = $('#pxStatusTxt');

      function pollStatus() {
        if (!statusChip) return;
        const live = isConnected && ws && ws.readyState === WebSocket.OPEN;
        statusChip.classList.toggle('idle', !live);
        if (statusTxt) statusTxt.textContent = live ? 'Connected' : 'Local mode';
      }
      pollStatus();
      setInterval(pollStatus, 1000);

      /* Config save / load — reuse the desktop-app round trip the Config
         tab already exposes, so both entry points behave identically. */
      const saveBtn = $('#pxSaveCfg');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          if (typeof exportConfig === 'function') exportConfig();
        });
      }

      const uploadBtn = $('#pxUploadCfg');
      if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
          if (typeof importConfig === 'function') importConfig();
        });
      }

      /* Alt + ←/→ walks the current group */
      document.addEventListener('keydown', e => {
        if (!e.altKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
        const chips = $$('.px-chip', track);
        if (!chips.length) return;
        const idx = chips.findIndex(c => c.classList.contains('active'));
        const next = chips[(idx + (e.key === 'ArrowRight' ? 1 : -1) + chips.length) % chips.length];
        if (next) { e.preventDefault(); next.click(); }
      });

      /* ─────────────────────────────────────────────────────────
         8. Card restructuring — module banner + section headers
         ───────────────────────────────────────────────────────── */

      const MODULES = {
        'Aimbot': {
          icon: 'ri-crosshair-2-line',
          sub: 'Dynamic tracking vectoring & anatomical priority lock',
          param: 'Vector Parameters',
          paramSub: 'Adjust reaction dynamics & keybinding'
        },
        'Aimbot Precision': { icon: 'ri-compasses-2-line', sub: 'Angular boundary, smoothing curve & velocity' },
        'Aim Assist': {
          icon: 'ri-focus-3-line',
          sub: 'Subtle pull towards target without full lock',
          param: 'Assist Parameters',
          paramSub: 'Activation, mode & tracking behaviour'
        },
        'Aim Assist Precision': { icon: 'ri-compasses-2-line', sub: 'Field, smoothing, velocity & pacing' },
        'Trigger Assist': {
          icon: 'ri-flashlight-line',
          sub: 'Automatic fire on crosshair target intersection',
          param: 'Trigger Parameters',
          paramSub: 'Activation window, delay & detection field'
        },
        'Trigger Assist Humanization': { icon: 'ri-brain-line', sub: 'Reaction spread, miss rate & burst pacing' },
        'RCS': {
          icon: 'ri-arrow-down-circle-line',
          sub: 'Recoil compensation applied per shot',
          param: 'Compensation Parameters',
          paramSub: 'Strength, speed & slowdown response'
        },
        'Assisted Aim': { icon: 'ri-ghost-line', sub: 'Off-crosshair resolution without view movement' },
        'Flicker': { icon: 'ri-flashlight-fill', sub: 'Instant snap and return to origin' },
        'Radar': { icon: 'ri-radar-line', sub: 'Live positional overlay of tracked entities' },
        'Spike Timer': { icon: 'ri-timer-flash-line', sub: 'Detonation countdown & defuse window' },
        'Colors': { icon: 'ri-palette-line', sub: 'Overlay palette and highlight tuning' },
        'Profiles': { icon: 'ri-folder-user-line', sub: 'Save, load and switch configuration sets' },
        'Community Configs': { icon: 'ri-team-line', sub: 'Browse configurations shared by other users' },
        'Risk': { icon: 'ri-alert-line', sub: 'Unlocks advanced features. Use at your own risk.' },
        'Live Radar Display': { icon: 'ri-radar-line', sub: 'Real-time minimap projection' }
      };

      const ICON_RULES = [
        /* specific before generic — first match wins */
        [/correlation/i,              'ri-line-chart-line'],
        [/jitter|micro-noise/i,       'ri-equalizer-line'],
        [/deviation/i,                'ri-git-branch-line'],
        [/bezier/i,                   'ri-route-line'],
        [/flick/i,                    'ri-cursor-line'],
        [/movement|pattern/i,         'ri-pulse-line'],
        [/reaction|delay|sleep/i,     'ri-timer-line'],
        [/fatigue/i,                  'ri-battery-low-line'],
        [/pause/i,                    'ri-pause-circle-line'],
        [/overshoot|undershoot/i,     'ri-arrow-go-forward-line'],
        [/tremor|scatter/i,           'ri-focus-2-line'],
        [/timing/i,                   'ri-time-line'],
        [/footstep|audio|sound/i,     'ri-headphone-line'],
        [/silent|ghost/i,             'ri-ghost-line'],
        [/dodge|flash|evade/i,        'ri-shield-flash-line'],
        [/aim|target|crosshair|fov/i, 'ri-crosshair-2-line'],
        [/trigger|fire|shoot/i,       'ri-flashlight-line'],
        [/recoil|rcs|spray/i,         'ri-arrow-down-circle-line'],
        [/human|behav|natural/i,      'ri-brain-line'],
        [/color|palette|visual|glow/i,'ri-palette-line'],
        [/radar|map|minimap/i,        'ri-radar-line'],
        [/timer|spike|clock/i,        'ri-timer-flash-line'],
        [/config|profile|preset/i,    'ri-save-line'],
        [/key|bind|hotkey/i,          'ri-keyboard-box-line'],
        [/perf|fps|render/i,          'ri-speed-up-line'],
        [/risk|warn|danger/i,         'ri-alert-line'],
        [/theme|appearance|ui/i,      'ri-brush-line'],
        [/line ?up|util|ability/i,    'ri-map-pin-line']
      ];

      function metaFor(title) {
        if (MODULES[title]) return MODULES[title];
        const rule = ICON_RULES.find(r => r[0].test(title));
        return { icon: rule ? rule[1] : 'ri-settings-4-line', sub: '' };
      }

      const DESC = {
        aimkey: 'Hold key to initiate targeting system',
        aimkey2: 'Secondary activation binding',
        aimkey_double: 'Enable a second activation key binding',
        aimkey_toggle: 'Press once to arm instead of holding',
        aimbot_smart_track: 'Predictive lead based on target velocity',
        selected_bodypart: 'Target bone priority vector',
        aimbot_fov: 'Angular detection boundary radius',
        aimbot_smooth: 'Interpolation smoothness curve',
        speed: 'Velocity multiplier towards target centre',
        aimbot_prediction: 'Compensation for target movement latency',
        head_offset_x: 'Horizontal deviation from bone origin',
        head_offset_y: 'Vertical deviation from bone origin',
        assist_aimkey: 'Hold key to apply assist pull',
        assist_aimkey_double: 'Enable a second activation key binding',
        assist_smart_track: 'Predictive lead based on target velocity',
        aimassist_fov: 'Angular detection boundary radius',
        aimassist_smooth: 'Interpolation smoothness curve',
        assist_speed: 'Velocity multiplier towards target centre',
        aimassist_prediction: 'Compensation for target movement latency',
        assist_sleep: 'Idle interval between correction ticks',
        triggerbot_key: 'Hold key to arm automatic fire',
        triggerbot_key_double: 'Enable a second activation key binding',
        triggerbot_delay: 'Wait time before the shot is released',
        triggerbot_fovX: 'Horizontal detection window',
        triggerbot_fovY: 'Vertical detection window',
        triggerbot_always_enabled: 'Run without holding the activation key',
        triggerbot_no_move_shoot: 'Suppress fire while the player is moving',
        triggerbot_reaction_min: 'Lower bound of the randomised reaction window',
        triggerbot_reaction_max: 'Upper bound of the randomised reaction window',
        triggerbot_miss_chance: 'Deliberate miss rate for natural spread',
        triggerbot_burst_control: 'Break sustained fire into bursts',
        triggerbot_burst_delay_min: 'Shortest pause between bursts',
        triggerbot_burst_delay_max: 'Longest pause between bursts',
        recoil_length: 'Downward compensation magnitude',
        recoil_speed: 'Rate the compensation is applied at',
        recoil_slowdown: 'Ease compensation near the end of a spray'
      };

      const LABEL_DESC = {
        'Enable': '',
        'Double Bind': 'Enable a second activation key binding',
        'Toggle Mode': 'Press once to arm instead of holding',
        'Smart Tracking': 'Predictive lead based on target velocity',
        'Bone': 'Target bone priority vector',
        'Mode': 'Behaviour profile for this module'
      };

      const MASTER_RE = /^(enable|enabled|master|active)$/i;

      function labelOf(row) {
        const l = row.querySelector('.ctrl-label');
        return l ? l.textContent.trim() : '';
      }

      function decorateRows(scope) {
        $$('.ctrl-row', scope).forEach(row => {
          if (row.querySelector('.px-lwrap')) return;
          const label = row.querySelector('.ctrl-label');
          if (!label) return;

          const wrap = document.createElement('div');
          wrap.className = 'px-lwrap';
          label.parentNode.insertBefore(wrap, label);
          wrap.appendChild(label);

          /* Sliders read "Label: value" on one line. The value node moves
             intact so it stays contenteditable and valBlur/valKey still
             see a bare number in its textContent. */
          const val = row.classList.contains('slider-row') ? row.querySelector('.slider-val') : null;
          if (val) {
            const line = document.createElement('div');
            line.className = 'px-sline';
            wrap.insertBefore(line, label);
            line.appendChild(label);
            const colon = document.createElement('span');
            colon.className = 'px-colon';
            colon.textContent = ':';
            line.appendChild(colon);
            line.appendChild(val);
          }

          const key = row.getAttribute('data-config');
          const text = (key && DESC[key]) || LABEL_DESC[label.textContent.trim()];
          if (text) {
            const d = document.createElement('span');
            d.className = 'px-desc';
            d.textContent = text;
            wrap.appendChild(d);
          }
        });
      }

      function buildHead(title, sub, icon, cls) {
        const head = document.createElement('div');
        head.className = cls;
        const ico = document.createElement('div');
        ico.className = cls === 'px-banner' ? 'px-banner-ico' : 'px-head-ico';
        ico.innerHTML = '<i class="' + icon + '"></i>';
        const txt = document.createElement('div');
        txt.className = 'px-head-txt';
        const h1 = document.createElement('div');
        h1.className = 'px-h1';
        h1.textContent = title;
        txt.appendChild(h1);
        if (sub) {
          const h2 = document.createElement('div');
          h2.className = 'px-h2';
          h2.textContent = sub;
          txt.appendChild(h2);
        }
        head.appendChild(ico);
        head.appendChild(txt);
        return head;
      }

      function enhanceCards() {
        $$('.tab-pane').forEach(pane => {
          const scroll = pane.querySelector('.tab-scroll') || pane;
          const leadSeen = {};

          $$('.card', pane).forEach(card => {
            if (card.dataset.pxDone) return;
            card.dataset.pxDone = '1';
            card.classList.add('card-anim');

            decorateRows(card);

            const titleEl = card.querySelector(':scope > .card-title');
            if (!titleEl) return;
            const title = titleEl.textContent.trim();
            const meta = metaFor(title);

            const rows = $$(':scope > .ctrl-row', card);
            const master = rows.find(r => MASTER_RE.test(labelOf(r)) && r.querySelector('.switch, .checkbox'));

            const topLevel = card.parentElement === scroll;
            const key = card.getAttribute('data-subtab') || '__';
            const isLead = topLevel && master && !leadSeen[key];

            if (isLead) {
              leadSeen[key] = true;
              const banner = buildHead(title, meta.sub, meta.icon, 'px-banner');
              banner.classList.add('card-anim');
              if (card.getAttribute('data-subtab')) banner.setAttribute('data-subtab', card.getAttribute('data-subtab'));
              banner.appendChild(master);          // node moves intact — data-config survives
              scroll.insertBefore(banner, card);

              card.insertBefore(
                buildHead(meta.param || title, meta.paramSub || meta.sub, meta.icon, 'px-head'),
                card.firstChild
              );
            } else {
              const head = buildHead(title, meta.sub, meta.icon, 'px-head');
              if (master) head.appendChild(master);
              card.insertBefore(head, card.firstChild);
            }

            titleEl.remove();
          });
        });
      }

      /* ─────────────────────────────────────────────────────────
         9. FOV visualizer segmented control
         ───────────────────────────────────────────────────────── */

      function enhanceFov() {
        $$('.fov-shape-switcher').forEach(sw => {
          if (sw.dataset.pxDone) return;
          sw.dataset.pxDone = '1';

          const seg = document.createElement('div');
          seg.className = 'px-seg';
          const ink = document.createElement('span');
          ink.className = 'px-seg-ink';
          seg.appendChild(ink);

          $$('.fov-shape-btn', sw).forEach(btn => {
            btn.textContent = btn.textContent.replace(/[^A-Za-z ]/g, '').trim();
            seg.appendChild(btn);
            btn.addEventListener('click', () => requestAnimationFrame(() => paint(true)));
          });
          sw.appendChild(seg);

          function paint(animate) {
            moveInk(ink, seg.querySelector('.fov-shape-btn.active'), animate === true);
          }
          requestAnimationFrame(() => paint(false));
          sw._pxPaint = paint;
        });
      }

      /* ─────────────────────────────────────────────────────────
         9b. Masonry for card-list panes
         ─────────────────────────────────────────────────────────
         Two real flex columns, greedily filled shortest-first.
         Heights are estimated from row counts because hidden panes
         measure 0 — an estimate is plenty for visual balance. */

      function masonize(paneId, groups) {
        const scroll = document.querySelector('#tab-' + paneId + ' .tab-scroll');
        if (!scroll || scroll.dataset.masonized) return;
        scroll.dataset.masonized = '1';

        const cards = Array.from(scroll.children).filter(el =>
          !el.classList.contains('page-header') &&
          !el.classList.contains('subtab-bar') &&
          !el.classList.contains('master-hum-card') &&
          !el.classList.contains('px-banner') &&
          !el.classList.contains('px-masonry'));
        if (cards.length < 3) return;

        const est = el => {
          let h = 64;
          $$(':scope > .ctrl-row', el).forEach(r => {
            h += r.classList.contains('slider-row') ? 80 : 46;
          });
          h += $$(':scope > div:not(.ctrl-row):not(.px-head)', el).length * 40;
          return h;
        };

        const buildMasonry = list => {
          const wrap = document.createElement('div');
          wrap.className = 'px-masonry';
          const cols = [document.createElement('div'), document.createElement('div')];
          const heights = [0, 0];
          cols.forEach(c => { c.className = 'px-mason-col'; wrap.appendChild(c); });

          list.forEach(el => {
            const i = heights[0] <= heights[1] ? 0 : 1;
            cols[i].appendChild(el);
            heights[i] += est(el) + 16;
          });
          return wrap;
        };

        if (!Array.isArray(groups) || !groups.length) {
          scroll.appendChild(buildMasonry(cards));
          return;
        }

        /* Grouped mode: a full-width "LABEL ────" divider per group,
           each followed by its own two-column masonry. Cards are
           claimed by title (.px-h1 after enhanceCards(), .card-title
           before); anything unclaimed lands in a trailing unlabeled
           masonry so no card is ever lost. */
        const titleOf = el => {
          const t = el.querySelector('.px-h1') || el.querySelector('.card-title');
          return t ? t.textContent.trim().toLowerCase() : '';
        };

        const pool = cards.slice();
        let firstDone = false;

        groups.forEach(g => {
          const members = [];
          (g.titles || []).forEach(want => {
            const w = String(want).trim().toLowerCase();
            const idx = pool.findIndex(el => titleOf(el) === w);
            if (idx !== -1) members.push(pool.splice(idx, 1)[0]);
          });
          if (!members.length) return;

          const head = document.createElement('div');
          head.className = 'px-section' + (firstDone ? '' : ' px-section-first');
          firstDone = true;
          const label = document.createElement('span');
          label.textContent = g.label;
          head.appendChild(label);

          scroll.appendChild(head);
          scroll.appendChild(buildMasonry(members));
        });

        if (pool.length) scroll.appendChild(buildMasonry(pool));
      }

      const HUM_GROUPS = [
        { label: 'Movement',        titles: ['Movement Patterns', 'Bezier Aim Path', 'Path Deviation', 'Flick Movement'] },
        { label: 'Timing & Rhythm', titles: ['Timing', 'Reaction Delay', 'Micro-Pauses', 'Fatigue Simulation'] },
        { label: 'Noise & Tremor',  titles: ['Jitter & Micro-Noise', 'Tremor & Scatter', 'Noise Correlation'] },
        { label: 'Correction',      titles: ['Overshoot', 'Bezier Overshoot/Undershoot'] }
      ];

      /* ─────────────────────────────────────────────────────────
         10. Boot
         ───────────────────────────────────────────────────────── */

      /* Layout-driven repaint (load, resize) — reposition, never travel. */
      function repaintAll() {
        paintTopNav(false);
        paintSubRail(false);
        $$('.fov-shape-switcher').forEach(sw => sw._pxPaint && sw._pxPaint(false));
      }

      function boot() {
        enhanceCards();
        enhanceFov();
        masonize('humanization', HUM_GROUPS);
        masonize('misc');
        masonize('config');

        const current = document.querySelector('.tab-pane.active');
        const tab = current ? current.id.replace(/^tab-/, '') : 'combat';
        const g = groupOf(tab) || visibleGroups()[0];
        state.tab = tab;
        state.group = g ? g.id : null;

        buildTopNav();
        if (g) buildSubRail(g.id, false);
        syncFav(tab);
        if (tab === 'combat') applySub(state.sub);

        /* applySub() above marks the combat cards visible immediately so the
           right sub-tab is showing — which would otherwise swallow the boot
           cascade entirely. Reveal after it, not before. */
        const active = document.querySelector('.tab-pane.active');
        if (active) revealCards(active, 30);
      }

      boot();
      window.addEventListener('load', () => requestAnimationFrame(repaintAll));
      window.addEventListener('resize', repaintAll);

      /* New cards can appear later (community configs, profiles). */
      if (mainEl && 'MutationObserver' in window) {
        let queued = false;

        /* Only wake up for nodes that actually need restyling — other
           scripts mutate this subtree constantly (slider wrappers, lists). */
        function relevant(records) {
          return records.some(r => Array.prototype.some.call(r.addedNodes, n =>
            n.nodeType === 1 && (
              n.matches('.card, .fov-shape-switcher') ||
              n.querySelector('.card, .fov-shape-switcher')
            )
          ));
        }

        new MutationObserver(records => {
          if (queued || !relevant(records)) return;
          queued = true;
          requestAnimationFrame(() => {
            queued = false;
            enhanceCards();
            enhanceFov();
          });
        }).observe(mainEl, { childList: true, subtree: true });
      }

      /* The rage group only exists once the risk toggle unlocks it. */
      setInterval(() => {
        const shouldShow = rageUnlocked();
        const hasTab = !!navEl && !!navEl.querySelector('.px-tab[data-group="rage"]');
        if (shouldShow !== hasTab) buildTopNav();
      }, 1200);
    })();
  

;


    window.PHX_SKIP_CONNECT = true;

    (function () {
      if (!window.PHX_SKIP_CONNECT) return;

      /* Silence the connect/retry cycle at the source. Removing the overlay
         on a timer only fought it — the retry kept rebuilding it, which is
         what made the whole app strobe. */
      const noop = function () {};
      [
        'connectToDesktopApp', 'retryConnection',
        'showOverlay', 'showConnectionError', 'showLoadingState',
        'showSwipeBanner', '_startFakeLoad'
      ].forEach(name => {
        if (typeof window[name] === 'function') window[name] = noop;
      });

      /* Tear down whatever the boot sequence already put on screen. */
      ['connOverlay', 'swipeBanner'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });

      const app = document.getElementById('app');
      if (app) {
        app.style.transition = 'opacity .35s ease';
        app.style.opacity = '1';
        app.style.pointerEvents = 'auto';
      }

      /* Pin the tab title — the rotator swaps it every 1.5s. */
      try {
        const t = document.querySelector('title') || document.head.appendChild(document.createElement('title'));
        t.textContent = 'AIM 360°';
        Object.defineProperty(document, 'title', {
          configurable: true,
          get() { return t.textContent; },
          set() {}
        });
      } catch (e) { /* non-fatal */ }
    })();
  

;


    (function () {
      'use strict';

      const ta     = document.getElementById('cfg-editor-input');
      const codeEl = document.getElementById('cfg-editor-code');
      const hlEl   = codeEl ? codeEl.parentElement : null;
      const stEl   = document.getElementById('cfg-editor-status');
      if (!ta || !codeEl || !hlEl) return;

      /* Same gather pathway as generateShareCode() — identical [data-config]
         scan and identical value shape, so the JSON round-trips straight into
         _applyCommunityData() with no new serialization format. */
      function collectCfg() {
        const data = {};
        const boneNames = ['Head','Neck','Chest','Pelvis','Custom'];
        document.querySelectorAll('[data-config]').forEach(el => {
          const key = el.getAttribute('data-config');
          const sw = el.querySelector('.switch, .checkbox');
          const slider = el.querySelector('input[type=range]');
          const dd = el.querySelector('.dd-selected');
          const bind = el.querySelector('.bind-box');
          if (sw) {
            data[key] = sw.classList.contains('active');
          } else if (slider) {
            const step = slider.step || '1';
            const isFloat = step.includes('.') || parseFloat(step) < 1;
            data[key] = isFloat ? parseFloat(slider.value) : parseInt(slider.value);
          } else if (dd) {
            if (key === 'selected_bodypart') {
              const idx = boneNames.indexOf(dd.textContent.trim());
              data[key] = idx >= 0 ? idx : 0;
            } else {
              data[key] = dd.textContent.trim();
            }
          } else if (bind) {
            data[key] = keyToHex(bind.textContent.trim());
          }
        });
        return data;
      }

      const escHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      /* Regex tokenizer over the raw source; every emitted chunk is
         HTML-escaped before it reaches innerHTML. Handles JSON plus
         ini-style `key = value` lines. */
      function highlightCfg(src) {
        const re = /("(?:[^"\\\n]|\\.)*")(\s*:)|("(?:[^"\\\n]|\\.)*")|\b(true|false|null)\b|(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|(^[ \t]*[A-Za-z_][A-Za-z0-9_.\-]*)(?=[ \t]*=)|([{}\[\]:,=])/gm;
        let out = '', last = 0, m;
        while ((m = re.exec(src))) {
          out += escHtml(src.slice(last, m.index));
          if (m[1] !== undefined)      out += '<span class="cfg-key">' + escHtml(m[1]) + '</span><span class="cfg-punc">' + escHtml(m[2]) + '</span>';
          else if (m[3] !== undefined) out += '<span class="cfg-str">' + escHtml(m[3]) + '</span>';
          else if (m[4] !== undefined) out += '<span class="cfg-bool">' + m[4] + '</span>';
          else if (m[5] !== undefined) out += '<span class="cfg-num">' + m[5] + '</span>';
          else if (m[6] !== undefined) out += '<span class="cfg-key">' + escHtml(m[6]) + '</span>';
          else                         out += '<span class="cfg-punc">' + escHtml(m[7]) + '</span>';
          last = re.lastIndex;
        }
        return out + escHtml(src.slice(last));
      }

      function syncScroll() {
        hlEl.scrollTop = ta.scrollTop;
        hlEl.scrollLeft = ta.scrollLeft;
      }

      function updateStatus() {
        const text = ta.value, t = text.trim();
        let valid = true;
        if (t && (t[0] === '{' || t[0] === '[')) {
          try { JSON.parse(t); } catch (e) { valid = false; }
        }
        stEl.textContent = text.length.toLocaleString('en-US') + ' chars · ' + (valid ? 'valid' : 'invalid JSON');
        stEl.classList.toggle('invalid', !valid);
      }

      function render() {
        const text = ta.value;
        /* trailing space keeps a final blank line the same height in both layers */
        codeEl.innerHTML = highlightCfg(text) + (/\n$/.test(text) ? ' ' : '');
        updateStatus();
        syncScroll();
      }

      ta.addEventListener('input', render);
      ta.addEventListener('scroll', syncScroll);

      window.cfgEditorRefresh = function (silent) {
        ta.value = JSON.stringify(collectCfg(), null, 2);
        render();
        if (!silent && typeof toast === 'function') toast('Config refreshed', 'refresh-line');
      };

      window.cfgEditorCopy = function () {
        const v = ta.value;
        if (!v.trim()) { toast('Nothing to copy', 'information-line'); return; }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(v)
            .then(() => toast('Copied', 'file-copy-line'))
            .catch(() => { ta.focus(); ta.select(); toast('Select + Ctrl+C to copy', 'information-line'); });
        } else {
          ta.focus(); ta.select();
          toast('Select + Ctrl+C to copy', 'information-line');
        }
      };

      window.cfgEditorApply = function () {
        let data;
        try {
          data = JSON.parse(ta.value);
        } catch (e) {
          toast('Invalid JSON — fix errors first', 'error-warning-line');
          return;
        }
        try {
          updateUIFromConfig(data);
          Object.entries(data).forEach(([key, value]) => {
            sendConfigUpdate(key, value);
          });
          // Recapture humanization base values from the applied config
          const ms = document.getElementById('masterHumSlider');
          const power = ms ? parseFloat(ms.value) : 1.0;
          _captureHumBaseValues(power);
          toast('Config applied', 'checkbox-circle-line');
          window.cfgEditorRefresh(true);   /* re-sync editor with normalized live state */
        } catch (e) {
          toast('Apply failed: ' + (e && e.message ? e.message : e), 'error-warning-line');
        }
      };

      /* Refresh whenever the Config pane becomes active — observed, so the
         existing switchTab flow stays untouched. */
      const pane = document.getElementById('tab-config');
      if (pane && window.MutationObserver) {
        let wasActive = pane.classList.contains('active');
        new MutationObserver(() => {
          const isActive = pane.classList.contains('active');
          if (isActive && !wasActive) window.cfgEditorRefresh(true);
          wasActive = isActive;
        }).observe(pane, { attributes: true, attributeFilter: ['class'] });
      }

      /* Populate on boot; re-run after load in case default values land late. */
      window.cfgEditorRefresh(true);
      window.addEventListener('load', () => setTimeout(() => window.cfgEditorRefresh(true), 60));
    })();
  

;


  /* ── Dropdown caret enhancer ────────────────────────────────────────────
     Appends a rotating chevron to every .dd-selected trigger (the lucide
     shim below converts the <i> into an svg that inherits .dd-caret), and
     keeps the owning .custom-dd's .open class in sync with its portal so
     the caret rotates on EVERY close path (select, click-outside,
     programmatic closes like syncColorModeDropdowns). Re-runs via a
     MutationObserver so dynamically created dropdowns — and labels reset
     with textContent — get their caret (back). */
  (function () {
    'use strict';

    function ensureCarets() {
      document.querySelectorAll('.custom-dd .dd-selected').forEach(function (sel) {
        if (sel.querySelector('.dd-caret')) return;
        var i = document.createElement('i');
        i.className = 'ri-arrow-down-s-line dd-caret';
        i.setAttribute('aria-hidden', 'true');
        sel.appendChild(i);
      });
    }

    function syncPortal(portal) {
      if (!portal.id) return;
      var isOpen = portal.classList.contains('open');
      document.querySelectorAll('.custom-dd[data-portal="' + portal.id + '"]').forEach(function (dd) {
        dd.classList.toggle('open', isOpen);
      });
    }

    ensureCarets();
    document.addEventListener('DOMContentLoaded', ensureCarets);

    var queued = false;
    function scheduleCarets() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; ensureCarets(); });
      setTimeout(function () { if (queued) { queued = false; ensureCarets(); } }, 80);
    }

    new MutationObserver(function (muts) {
      var needCarets = false;
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.type === 'attributes') {
          var t = m.target;
          if (t.nodeType === 1 && t.classList.contains('dd-portal')) syncPortal(t);
        } else if (m.type === 'childList') {
          needCarets = true;
        }
      }
      if (needCarets) scheduleCarets();
    }).observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  })();


;

/* AIM360° inline SVG icon engine — replaces ri-* font glyphs with crisp SVGs */
(function () {
  'use strict';
  var MAP = {"ri-focus-3-line":"target","ri-crosshair-2-line":"target","ri-fire-line":"flame","ri-flashlight-line":"zap","ri-flashlight-fill":"zap","ri-brain-line":"activity","ri-pulse-line":"activity","ri-radar-line":"radar","ri-timer-flash-line":"timer","ri-timer-line":"timer","ri-palette-line":"palette","ri-brush-line":"brush","ri-settings-4-line":"settings","ri-tools-line":"settings","ri-save-line":"save","ri-shield-star-line":"shield","ri-shield-flash-line":"shield","ri-search-line":"search","ri-shut-down-line":"power","ri-star-line":"star","ri-star-fill":"star-fill","ri-arrow-down-s-line":"chevron-down","ri-arrow-right-s-line":"chevron-right","ri-arrow-left-s-line":"chevron-left","ri-add-line":"plus","ri-close-line":"x","ri-check-line":"check","ri-delete-bin-line":"trash","ri-file-text-line":"file-text","ri-file-copy-line":"copy","ri-qr-code-line":"qr","ri-refresh-line":"refresh","ri-external-link-line":"external-link","ri-download-line":"download","ri-download-2-line":"download","ri-upload-line":"upload","ri-keyboard-box-line":"keyboard","ri-cursor-line":"cursor","ri-logout-box-line":"logout","ri-restart-line":"restart","ri-arrow-go-back-line":"arrow-left","ri-arrow-go-forward-line":"arrow-right","ri-arrow-down-circle-line":"restart","ri-checkbox-circle-line":"circle-check","ri-error-warning-line":"circle-alert","ri-information-line":"info","ri-moon-line":"moon","ri-sun-line":"sun","ri-stars-line":"sparkles","ri-heart-line":"heart","ri-water-flash-line":"droplet","ri-leaf-line":"droplet","ri-user-heart-line":"heart","ri-loader-4-line":"loader","ri-computer-line":"monitor","ri-home-4-line":"home","ri-user-unfollow-line":"user-x","ri-team-line":"users","ri-ghost-line":"ghost","ri-compasses-2-line":"compass","ri-alert-line":"triangle","ri-line-chart-line":"chart","ri-equalizer-line":"equalizer","ri-git-branch-line":"branch","ri-route-line":"route","ri-battery-low-line":"battery","ri-pause-circle-line":"pause","ri-focus-2-line":"focus","ri-time-line":"clock","ri-headphone-line":"headphones","ri-speed-up-line":"gauge"};
  var svgNS = 'http://www.w3.org/2000/svg';
  var xlinkNS = 'http://www.w3.org/1999/xlink';

  function swap(root) {
    var els = (root || document).querySelectorAll('i[class*="ri-"]');
    els.forEach(function (el) {
      var ri = null;
      el.classList.forEach(function (c) { if (!ri && c.indexOf('ri-') === 0) ri = c; });
      var id = MAP[ri];
      if (!id) { el.style.display = 'none'; return; }
      var svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('class', 'p-icon ' + Array.prototype.filter.call(el.classList, function (c) {
        return c.indexOf('ri-') !== 0;
      }).join(' '));
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('aria-hidden', 'true');
      var use = document.createElementNS(svgNS, 'use');
      use.setAttributeNS(xlinkNS, 'xlink:href', '#a360-' + id);
      use.setAttribute('href', '#a360-' + id);
      svg.appendChild(use);
      el.parentNode.replaceChild(svg, el);
    });
  }

  window.a360Icons = swap;
  swap(document);

  var scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    var run = function () { if (!scheduled) return; scheduled = false; swap(document); };
    requestAnimationFrame(run);
    setTimeout(run, 60);
  }
  var mo = new MutationObserver(function (muts) {
    if (scheduled) return;
    var relevant = false;
    for (var i = 0; i < muts.length && !relevant; i++) {
      var added = muts[i].addedNodes;
      for (var j = 0; j < added.length; j++) {
        var n = added[j];
        if (n.nodeType !== 1) continue;
        if ((n.matches && n.matches('i[class*="ri-"]')) ||
            (n.querySelector && n.querySelector('i[class*="ri-"]'))) { relevant = true; break; }
      }
    }
    if (relevant) schedule();
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', function () { swap(document); });
})();

;

(function () {
  const $ = s => document.querySelector(s);
  const val = (key, fallback) => Number($('[data-config="' + key + '"] input[type=range]')?.value ?? fallback);
  const activeModule = () => $('.px-chip.active');
  function collect() {
    if (typeof cfgEditorRefresh === 'function') cfgEditorRefresh(true);
    return JSON.parse($('#cfg-editor-input').value);
  }
  function refresh() {
    const chip = activeModule();
    const heading = $('#aimTitle');
    if (heading) { heading.textContent = 'AIM ENGINE 360°'; }
    $('#aimGroup').textContent = $('.px-tab.active')?.textContent.toUpperCase() || 'COMBAT';
    const sub = chip?.dataset.sub || 'aimbot';
    const pane = $('.tab-pane.active');
    const enabled = pane?.querySelector(sub ? '[data-subtab="' + sub + '"] .switch' : '.switch');
    $('#aimModuleState').textContent = enabled ? (enabled.classList.contains('active') ? 'MODULE ENABLED' : 'MODULE DISABLED') : 'CONFIGURATION';
    const key = sub === 'aim-assist' ? 'aimassist' : 'aimbot';
    const smooth = val(key + '_smooth', 5);
    const speed = val(sub === 'aim-assist' ? 'assist_speed' : 'speed', 1);
    $('#aimFieldValue').textContent = $('#fov_display')?.textContent + (sub === 'trigger' ? ' px' : '°');
    $('#aimBoneValue').textContent = $('#dd-bone .dd-selected')?.textContent.trim() || 'Head';
    const isTrigger = sub === 'trigger';
    $('#aimCurveLabel').textContent = isTrigger ? 'WINDOW X / Y' : 'SMOOTH ' + smooth + ' · SPEED ' + speed;
    $('.aim-curve-head > span').textContent = isTrigger ? 'Detection window' : 'Response curve';
    const canvas = $('#aimResponseCurve');
    const ctx = canvas.getContext('2d');
    const style = getComputedStyle(document.documentElement);
    const accent = style.getPropertyValue('--accent').trim();
    const grid = style.getPropertyValue('--card-border').trim();
    ctx.clearRect(0,0,600,140); ctx.lineWidth = 1; ctx.strokeStyle = grid;
    for(let y=0;y<140;y+=35){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(600,y);ctx.stroke();}
    for(let x=0;x<600;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,140);ctx.stroke();}
    ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.beginPath();
    for(let x=0;x<=600;x++) {
      const t=x/600;
      const y=isTrigger ? (t > .5-val('triggerbot_fovX',4)/400 && t < .5+val('triggerbot_fovX',4)/400 ? 140-Math.min(130,val('triggerbot_fovY',4)*.65) : 138) : 138-(1-Math.exp(-t*speed*3/smooth))*132;
      if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.stroke();
    document.querySelectorAll('.switch,.checkbox,.bind-box,.dd-selected').forEach(el => {
      el.tabIndex=0;
      if(el.matches('.switch,.checkbox')) { el.setAttribute('role','switch');el.setAttribute('aria-checked',String(el.classList.contains('active'))); }
      else el.setAttribute('role','button');
      el.setAttribute('aria-label',el.closest('.ctrl-row')?.querySelector('.ctrl-label')?.textContent.trim() || el.textContent.trim());
    });
    document.querySelectorAll('input[type=range]').forEach(el => el.setAttribute('aria-label',el.closest('.ctrl-row')?.querySelector('.ctrl-label')?.textContent.trim() || 'Value'));
  }
  window.exportConfig = function () {
    try {
      const blob = new Blob([JSON.stringify(collect(),null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob); const link=document.createElement('a');link.href=url;link.download=($('#cfg-filename-input')?.value || 'aim360')+'.cfg';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Configuration exported');
    } catch { toast('Unable to export configuration'); }
  };
  window.importConfig = function () {
    const input=document.createElement('input'); input.type='file';input.accept='.cfg,.json';
    input.onchange=async()=>{try { const file=input.files?.[0];if(!file)return;const data=JSON.parse(await file.text());if(!data || Array.isArray(data) || typeof data!=='object')throw new Error('Invalid'); updateUIFromConfig(data); document.querySelectorAll('input[type=range]').forEach(el=>updateSlider(el));refreshFovVis();refresh();toast('Configuration imported'); }catch { toast('Invalid configuration file'); }};
    input.click();
  };
  $('#aimExport').onclick=()=>exportConfig();
  $('#aimProfiles').onclick=()=>{document.querySelector('.px-tab[data-group="system"]').click();setTimeout(()=>document.querySelector('.px-chip[data-tab="config"]')?.click(),30);};
  function openLocalPopout(type) {
    const win=window.open('', 'aim360-'+type, 'width=520,height=640,resizable=yes');
    if(!win){toast('Please allow popups for this workspace');return;}
    win.document.title='AIM 360° — '+type;
    const style=win.document.createElement('style');style.textContent='body{margin:0;padding:24px;background:'+getComputedStyle(document.documentElement).getPropertyValue('--bg')+';color:'+getComputedStyle(document.documentElement).getPropertyValue('--text')+';font:14px sans-serif}h1{font-size:20px;font-weight:500}p{opacity:.55}canvas{width:100%;height:auto}ul{list-style:none;padding:0}li{display:flex;justify-content:space-between;border-bottom:1px solid '+getComputedStyle(document.documentElement).getPropertyValue('--card-border')+';padding:14px 0}';win.document.head.replaceChildren(style);win.document.body.replaceChildren();
    win.document.title='AIM 360° — '+type;
    const h=win.document.createElement('h1');h.textContent=type;win.document.body.append(h);
    if(type==='Radar'){
      const canvas=win.document.createElement('canvas');canvas.width=400;canvas.height=400;win.document.body.append(canvas);
      const copy=()=>{if(win.closed)return;const source=$('#radar-canvas');if(source)canvas.getContext('2d').drawImage(source,0,0,400,400);requestAnimationFrame(copy);};copy();
      const note=win.document.createElement('p');note.textContent='Local view · awaiting desktop telemetry';win.document.body.append(note);
    }else if(type==='Keybinds'){
      const list=win.document.createElement('ul');win.document.body.append(list);
      const update=()=>{if(win.closed)return;list.replaceChildren();document.querySelectorAll('.bind-box').forEach(bind=>{if(!bind.closest('.tab-pane') || bind.closest('#tab-silent,#tab-flicker'))return;const li=win.document.createElement('li');const label=win.document.createElement('span');label.textContent=bind.closest('[data-config]')?.dataset.config || 'Key';const key=win.document.createElement('b');key.textContent=bind.textContent;li.append(label,key);list.append(li);});setTimeout(update,300);};update();
    }else{
      const timer=win.document.createElement('p');timer.textContent='Awaiting objective telemetry';win.document.body.append(timer);
    }
  }
  window.openRadarPopout=()=>openLocalPopout('Radar');
  window.openSpikeTimerPopout=()=>openLocalPopout('Spike Timer');
  window.openKeybindsPopout=()=>openLocalPopout('Keybinds');
  document.addEventListener('input',()=>requestAnimationFrame(refresh));
  document.addEventListener('click',()=>setTimeout(refresh,70));
  document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ') && e.target.matches('.switch,.checkbox,.bind-box,.dd-selected')) {e.preventDefault();e.target.click();}setTimeout(refresh,70);});
  const footer=document.createElement('footer');footer.className='aim-footer';footer.innerHTML='<span>AIM 360° <b> / </b> PRECISION BEYOND LIMITS.</span><span>LOCAL WORKSPACE <b>●</b></span>';$('#app').append(footer);
  refresh();setTimeout(refresh,350);
})();

;

document.addEventListener('DOMContentLoaded', function() {
  if (window.lucide) {
    try { window.lucide.createIcons(); } catch(e){}
  }
});

;

document.addEventListener('DOMContentLoaded', function() {
  console.log('AIM 360° Performance & Smoothness Optimizer active');
  
  // Replace missing header logos if any
  document.querySelectorAll('img').forEach(img => {
    if (!img.src || img.src.length < 10 || img.src.endsWith('src=""')) {
      img.src = 'data:,';
      img.classList.add('brand-logo-img');
    }
  });

  // Optimize all input sliders for 120 FPS zero-delay response
  const sliders = document.querySelectorAll('input[type="range"]');
  sliders.forEach(slider => {
    let ticking = false;
    slider.addEventListener('input', function(e) {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          const valDisplay = slider.parentElement ? slider.parentElement.querySelector('.val, .value, span') : None;
          if (valDisplay) valDisplay.textContent = slider.value;
          ticking = false;
        });
        ticking = true;
      }
    });
  });
});

;

document.addEventListener('DOMContentLoaded', function() {
  console.log('AIM 360° Mouse Wheel Smooth Physics initialized');
  
  });

;

/* AIM360° custom-crosshair preview */
function chUpdate() {
  var box = document.getElementById('chRender');
  if (!box) return;
  var len = parseFloat((document.getElementById('ch_len') || {}).value) || 0;
  var thk = parseFloat((document.getElementById('ch_thk') || {}).value) || 2;
  var gap = parseFloat((document.getElementById('ch_gap') || {}).value) || 0;
  var col = (document.getElementById('ch_col') || {}).value || '#EAECF1';
  var dotOn = (document.getElementById('ch_dot') || {}).classList && document.getElementById('ch_dot').classList.contains('active');
  var outOn = (document.getElementById('ch_out') || {}).classList && document.getElementById('ch_out').classList.contains('active');
  var tOn   = (document.getElementById('ch_t') || {}).classList && document.getElementById('ch_t').classList.contains('active');
  box.style.setProperty('--ch-color', col);
  var c = 'ch-arm' + (outOn ? ' out' : '');
  var h = '';
  var half = thk / 2;
  // vertical arms
  h += '<span class="' + c + '" style="width:' + thk + 'px;height:' + len + 'px;left:calc(50% - ' + half + 'px);top:calc(50% - ' + (gap + len) + 'px)"></span>';
  if (!tOn) h += '<span class="' + c + '" style="width:' + thk + 'px;height:' + len + 'px;left:calc(50% - ' + half + 'px);top:calc(50% + ' + gap + 'px)"></span>';
  // horizontal arms
  h += '<span class="' + c + '" style="height:' + thk + 'px;width:' + len + 'px;top:calc(50% - ' + half + 'px);left:calc(50% - ' + (gap + len) + 'px)"></span>';
  h += '<span class="' + c + '" style="height:' + thk + 'px;width:' + len + 'px;top:calc(50% - ' + half + 'px);left:calc(50% + ' + gap + 'px)"></span>';
  if (dotOn) h += '<span class="' + c + '" style="width:' + thk + 'px;height:' + thk + 'px;left:calc(50% - ' + half + 'px);top:calc(50% - ' + half + 'px)"></span>';
  box.innerHTML = h;
}
document.addEventListener('DOMContentLoaded', function () { chUpdate(); });
setTimeout(chUpdate, 400);
