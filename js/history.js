/* ============================================================
   MIDINARI — history.js
   Controlador del Historial de Decisiones Financieras
   ============================================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'midinari_history';

  const fmt = {
    currency: (val) => {
      const code = localStorage.getItem('dinari_currency') || 'DOP';
      const symbol = {
        MXN: 'MX$', USD: 'US$', EUR: '€', COP: 'COL$',
        ARS: 'AR$', CLP: 'CLP$', PEN: 'S/', DOP: 'RD$'
      }[code] || '$';
      return `${symbol} ${Math.round(val).toLocaleString('es-DO')}`;
    },
    percent: (val) => `${val.toFixed(1)}%`,
    date: (isoStr) => {
      const d = new Date(isoStr);
      return d.toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  };

  let historyRecords = [];
  let currentFilter = 'all';
  let searchQuery = '';
  let selectedForCompare = [];

  function init() {
    loadHistory();
    renderAll();
    setupEventListeners();
  }

  function loadHistory() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        historyRecords = JSON.parse(raw);
      } catch (e) {
        historyRecords = [];
      }
    }
  }

  function saveHistory() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(historyRecords));
  }

  function renderAll() {
    renderGrid();
    updateCompareBar();
  }

  function renderGrid() {
    const grid = document.getElementById('history-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const filtered = historyRecords.filter(r => {
      // 1. Filtrar por categoría
      if (currentFilter === 'favs' && !r.isFavorite) return false;
      if (currentFilter !== 'all' && currentFilter !== 'favs' && r.herramienta !== currentFilter) return false;

      // 2. Filtrar por búsqueda
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = r.nombre.toLowerCase().includes(query);
        const matchesNotes = r.notes && r.notes.toLowerCase().includes(query);
        if (!matchesName && !matchesNotes) return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align:center; padding:var(--sp-8); background:var(--cream-100); border: 1px dashed var(--cream-300); border-radius: var(--radius-lg);">
          <p class="body-sm" style="color:var(--stone-400); margin:0;">No se encontraron registros en esta categoría.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(r => {
      const card = document.createElement('div');
      card.className = 'hist-card';
      
      const isChecked = selectedForCompare.includes(r.id);
      const isFav = r.isFavorite;

      const toolLabels = {
        deudas: 'Simulador de Deudas',
        'pago-minimo': 'Simulador de Pago Mínimo',
        ahorro: 'Calculadora de Ahorro',
        prestamos: 'Calculadora de Préstamos',
        emergencia: 'Fondo de Emergencia',
        comparador: 'Comparador de Escenarios'
      };

      const dateStr = fmt.date(r.fecha);

      // Métricas clave del registro para mostrar en la card
      const debtVal = r.outputData.deudaTotal || r.profileSnapshot.deudaTotal || 0;
      const savingsVal = r.outputData.ahorroMensual || r.profileSnapshot.ahorroMensual || 0;
      const monthsVal = r.outputData.meses || 0;
      const interestVal = r.outputData.intereses || 0;

      card.innerHTML = `
        <div>
          <div class="hist-card__header">
            <div>
              <span class="hist-card__tag">${toolLabels[r.herramienta] || r.herramienta}</span>
              <span style="font-size:10px; color:var(--stone-400); margin-left:var(--sp-2);">${dateStr}</span>
            </div>
            <button class="btn-fav ${isFav ? 'active' : ''}" data-id="${r.id}">★</button>
          </div>
          
          <h3 class="heading-4" style="margin-bottom:var(--sp-2);">${r.nombre}</h3>
          ${r.notes ? `<p class="body-xs" style="color:var(--stone-500); margin-bottom:var(--sp-4); line-height:1.4; border-left:2px solid var(--cream-300); padding-left:8px;">${r.notes}</p>` : ''}

          <div class="hist-card__metrics">
            <div class="hist-metric-item">Deuda Total: <strong>${fmt.currency(debtVal)}</strong></div>
            <div class="hist-metric-item">Ahorro Mensual: <strong>${fmt.currency(savingsVal)}</strong></div>
            <div class="hist-metric-item">Tiempo: <strong>${monthsVal === 999 ? 'Eterno' : (monthsVal === 0 ? 'Sin Deudas' : `${monthsVal} meses`)}</strong></div>
            <div class="hist-metric-item">Intereses: <strong>${interestVal === 999 ? 'Eterno' : fmt.currency(interestVal)}</strong></div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--cream-200); padding-top:var(--sp-3); margin-top:var(--sp-2);">
          <label style="font-size:11px; display:flex; align-items:center; gap:6px; cursor:pointer;">
            <input type="checkbox" class="compare-checkbox" data-id="${r.id}" ${isChecked ? 'checked' : ''} />
            <span>Comparar</span>
          </label>
          <div style="display:flex; gap:6px;">
            <button class="btn btn--outline btn-edit-notes" data-id="${r.id}" style="padding:4px 8px; font-size:10px;">Notas</button>
            <button class="btn btn--outline btn-duplicate-rec" data-id="${r.id}" style="padding:4px 8px; font-size:10px;">Duplicar</button>
            <button class="btn btn-delete-rec" data-id="${r.id}" style="border-color:var(--danger); color:var(--danger); background:none; padding:4px 8px; font-size:10px;">Eliminar</button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  function updateCompareBar() {
    const bar = document.getElementById('compare-bar');
    const text = document.getElementById('compare-selection-text');
    const runBtn = document.getElementById('btn-run-compare');
    if (!bar || !text || !runBtn) return;

    const count = selectedForCompare.length;
    if (count > 0) {
      bar.classList.add('visible');
      if (count === 1) {
        text.textContent = 'Seleccionado 1 registro. Selecciona el segundo para iniciar comparación.';
        runBtn.disabled = true;
      } else {
        const names = selectedForCompare.map(id => {
          const r = historyRecords.find(item => item.id === id);
          return r ? `"${r.nombre}"` : '';
        });
        text.textContent = `Listos para comparar: ${names[0]} vs ${names[1]}`;
        runBtn.disabled = false;
      }
    } else {
      bar.classList.remove('visible');
    }
  }

  function setupEventListeners() {
    // 1. Buscador
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderGrid();
      });
    }

    // 2. Filtros de categoría
    const filterContainer = document.getElementById('filter-container');
    if (filterContainer) {
      filterContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-tag')) {
          filterContainer.querySelectorAll('.filter-tag').forEach(btn => btn.classList.remove('active'));
          e.target.classList.add('active');
          currentFilter = e.target.dataset.filter;
          renderGrid();
        }
      });
    }

    // 3. Grid Delegado: Favorito, Checkbox, Editar, Duplicar, Eliminar
    const grid = document.getElementById('history-grid');
    if (grid) {
      grid.addEventListener('click', (e) => {
        const target = e.target;
        const id = target.dataset.id;
        
        if (target.classList.contains('btn-fav')) {
          const r = historyRecords.find(item => item.id === id);
          if (r) {
            r.isFavorite = !r.isFavorite;
            saveHistory();
            renderGrid();
          }
        } else if (target.classList.contains('compare-checkbox')) {
          if (target.checked) {
            if (selectedForCompare.length >= 2) {
              alert('Solo puedes comparar un máximo de 2 registros simultáneamente.');
              target.checked = false;
            } else {
              selectedForCompare.push(id);
            }
          } else {
            selectedForCompare = selectedForCompare.filter(item => item !== id);
          }
          updateCompareBar();
        } else if (target.classList.contains('btn-edit-notes')) {
          openEditModal(id);
        } else if (target.classList.contains('btn-duplicate-rec')) {
          duplicateRecord(id);
        } else if (target.classList.contains('btn-delete-rec')) {
          deleteRecord(id);
        }
      });
    }

    // 4. Modal de Edición
    const editModal = document.getElementById('edit-modal');
    const closeEdit = document.getElementById('btn-close-edit-modal');
    const cancelEdit = document.getElementById('btn-cancel-edit');
    const editForm = document.getElementById('edit-form');

    if (closeEdit && editModal) closeEdit.onclick = () => editModal.classList.remove('open');
    if (cancelEdit && editModal) cancelEdit.onclick = () => editModal.classList.remove('open');
    if (editForm && editModal) {
      editForm.onsubmit = (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-id').value;
        const name = document.getElementById('edit-name').value.trim();
        const notes = document.getElementById('edit-notes').value.trim();

        const r = historyRecords.find(item => item.id === id);
        if (r) {
          r.nombre = name;
          r.notes = notes;
          saveHistory();
          editModal.classList.remove('open');
          renderGrid();
        }
      };
    }

    // 5. Modal de Comparación
    const compareModal = document.getElementById('compare-modal');
    const btnCompare = document.getElementById('btn-run-compare');
    const closeCompare = document.getElementById('btn-close-compare-modal');
    const closeCompareOk = document.getElementById('btn-close-compare-ok');

    if (btnCompare && compareModal) {
      btnCompare.onclick = () => {
        if (selectedForCompare.length === 2) {
          runSideBySideComparison();
          compareModal.classList.add('open');
        }
      };
    }
    if (closeCompare && compareModal) closeCompare.onclick = () => compareModal.classList.remove('open');
    if (closeCompareOk && compareModal) closeCompareOk.onclick = () => compareModal.classList.remove('open');
  }

  function openEditModal(id) {
    const r = historyRecords.find(item => item.id === id);
    if (!r) return;

    document.getElementById('edit-id').value = r.id;
    document.getElementById('edit-name').value = r.nombre;
    document.getElementById('edit-notes').value = r.notes || '';
    
    document.getElementById('edit-modal').classList.add('open');
  }

  function duplicateRecord(id) {
    const original = historyRecords.find(item => item.id === id);
    if (!original) return;

    const clone = {
      ...original,
      id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      nombre: original.nombre + ' (Copia)',
      fecha: new Date().toISOString(),
      isFavorite: false
    };

    historyRecords.push(clone);
    saveHistory();
    renderGrid();
  }

  function deleteRecord(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este registro del historial?')) {
      historyRecords = historyRecords.filter(item => item.id !== id);
      selectedForCompare = selectedForCompare.filter(item => item !== id);
      saveHistory();
      renderAll();
    }
  }

  function runSideBySideComparison() {
    const a = historyRecords.find(item => item.id === selectedForCompare[0]);
    const b = historyRecords.find(item => item.id === selectedForCompare[1]);
    if (!a || !b) return;

    document.getElementById('compare-header-a').textContent = a.nombre;
    document.getElementById('compare-header-b').textContent = b.nombre;

    const tbody = document.getElementById('compare-results-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    const metrics = [
      {
        label: 'Deuda Total',
        valA: a.outputData.deudaTotal || a.profileSnapshot.deudaTotal || 0,
        valB: b.outputData.deudaTotal || b.profileSnapshot.deudaTotal || 0,
        format: fmt.currency,
        lowerIsBetter: true
      },
      {
        label: 'Ahorro Mensual',
        valA: a.outputData.ahorroMensual || a.profileSnapshot.ahorroMensual || 0,
        valB: b.outputData.ahorroMensual || b.profileSnapshot.ahorroMensual || 0,
        format: fmt.currency,
        lowerIsBetter: false
      },
      {
        label: 'Pago Mensual Deuda',
        valA: a.outputData.pagoMensual || a.profileSnapshot.pagoMensualDeuda || 0,
        valB: b.outputData.pagoMensual || b.profileSnapshot.pagoMensualDeuda || 0,
        format: fmt.currency,
        lowerIsBetter: true
      },
      {
        label: 'Tiempo Estimado',
        valA: a.outputData.meses || 0,
        valB: b.outputData.meses || 0,
        format: (val) => val === 999 ? 'Eterno' : (val === 0 ? 'Sin Deudas' : `${val} meses`),
        lowerIsBetter: true
      },
      {
        label: 'Intereses Totales',
        valA: a.outputData.intereses || 0,
        valB: b.outputData.intereses || 0,
        format: (val) => val === 999 ? 'Eterno' : fmt.currency(val),
        lowerIsBetter: true
      },
      {
        label: 'Financial Score',
        valA: a.score || 50,
        valB: b.score || 50,
        format: (val) => String(val),
        lowerIsBetter: false
      }
    ];

    metrics.forEach(m => {
      const tr = document.createElement('tr');
      const diff = m.valB - m.valA;
      
      let diffText = '';
      let tdClass = '';

      if (diff === 0) {
        diffText = 'Sin cambios';
      } else {
        const sign = diff > 0 ? '+' : '';
        const pct = m.valA > 0 ? ` (${sign}${((diff / m.valA) * 100).toFixed(1)}%)` : '';
        const isBetter = m.lowerIsBetter ? (diff < 0) : (diff > 0);
        
        diffText = `${sign}${m.format(diff)}${pct}`;
        tdClass = isBetter ? 'diff-better' : 'diff-worse';
      }

      tr.innerHTML = `
        <td style="font-weight:600;">${m.label}</td>
        <td>${m.format(m.valA)}</td>
        <td>${m.format(m.valB)}</td>
        <td class="${tdClass}">${diffText}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Polling para esperar scripts del Core
  const checkInterval = setInterval(() => {
    if (window.MidinariProfile && window.MidinariAdvisor) {
      clearInterval(checkInterval);
      init();
    }
  }, 50);

})();
