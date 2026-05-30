import React, { useState, useEffect, useCallback } from 'react';
import { getCategories, getComponents, getFilters, validateBuild, getBenchmarks, getScenarios, saveBuild, getBuildByShareCode } from './api';
import AdminApp from './AdminApp';

// ─── Helpers ────────────────────────────────────────────────────────────────
const categoryToKey = (slug) => {
  const map = { cpu:'cpu', motherboard:'motherboard', ram:'ram', gpu:'gpu', storage:'storage', psu:'psu' };
  return map[slug] ?? slug;
};

const getIcon = (slug) => {
  const map = { cpu:'memory', motherboard:'developer_board', ram:'analytics', gpu:'video_settings', storage:'storage', psu:'bolt' };
  return map[slug] ?? 'settings';
};

const parseSpecs = (json) => { try { return JSON.parse(json); } catch { return {}; } };

const buildDescription = (comp, slug) => {
  if (!comp) return null;
  const s = parseSpecs(comp.specsJson);
  const parts = [];
  if (slug === 'cpu') {
    if (s.core_count) parts.push(`${s.core_count} ядер`);
    if (s.boost_clock) parts.push(`до ${s.boost_clock} GHz`);
    if (comp.socket && comp.socket !== 'N/A') parts.push(comp.socket);
    if (comp.tdp > 0) parts.push(`${comp.tdp}W TDP`);
  } else if (slug === 'motherboard') {
    if (comp.socket && comp.socket !== 'N/A') parts.push(comp.socket);
    if (s.form_factor) parts.push(s.form_factor);
    if (comp.memoryType && comp.memoryType !== 'N/A') parts.push(comp.memoryType);
  } else if (slug === 'ram') {
    if (s.modules) parts.push(`${s.modules[0]}×${s.modules[1]}GB`);
    if (s.speed) parts.push(`DDR${s.speed[0]}-${s.speed[1]}`);
    if (comp.memoryType && comp.memoryType !== 'N/A') parts.push(comp.memoryType);
  } else if (slug === 'gpu') {
    if (s.memory) parts.push(`${s.memory}GB VRAM`);
    if (comp.tdp > 0) parts.push(`${comp.tdp}W TDP`);
  } else if (slug === 'storage') {
    if (s.capacity) parts.push(`${s.capacity}GB`);
    if (s.type) parts.push(s.type);
  } else if (slug === 'psu') {
    if (s.wattage) parts.push(`${s.wattage}W`);
    if (s.efficiency_rating) parts.push(s.efficiency_rating);
  }
  return parts.length ? parts.join(' · ') : comp.categoryName;
};

// ─── Compatibility heuristic ────────────────────────────────────────────────
const isCompatible = (comp, build, activeCategorySlug) => {
  if (activeCategorySlug === 'cpu') {
    if (build.motherboard?.socket && build.motherboard.socket !== 'N/A' && comp.socket && comp.socket !== 'N/A')
      return build.motherboard.socket === comp.socket;
  }
  if (activeCategorySlug === 'motherboard') {
    if (build.cpu?.socket && build.cpu.socket !== 'N/A' && comp.socket && comp.socket !== 'N/A')
      if (build.cpu.socket !== comp.socket) return false;
    if (build.ram?.memoryType && build.ram.memoryType !== 'N/A' && comp.memoryType && comp.memoryType !== 'N/A')
      if (build.ram.memoryType !== comp.memoryType) return false;
  }
  if (activeCategorySlug === 'ram') {
    if (build.motherboard?.memoryType && build.motherboard.memoryType !== 'N/A' && comp.memoryType && comp.memoryType !== 'N/A')
      if (build.motherboard.memoryType !== comp.memoryType) return false;
  }
  return true;
};

// ─── Top App Bar (shared) ───────────────────────────────────────────────────
const BottomNav = ({ screen, onNavigate }) => (
  <nav className="md:hidden fixed bottom-0 w-full bg-surface-container-lowest border-t border-outline-variant flex justify-around items-center h-16 z-50">
    <button onClick={() => onNavigate('build')} className={`flex flex-col items-center gap-1 w-full h-full justify-center transition-colors ${screen === 'build' || screen === 'picker' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
      <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: screen === 'build' || screen === 'picker' ? '"FILL" 1' : '"FILL" 0' }}>build</span>
      <span className="text-[10px] font-medium">Сборка</span>
    </button>
    <button onClick={() => onNavigate('benchmarks')} className={`flex flex-col items-center gap-1 w-full h-full justify-center transition-colors ${screen === 'benchmarks' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
      <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: screen === 'benchmarks' ? '"FILL" 1' : '"FILL" 0' }}>speed</span>
      <span className="text-[10px] font-medium">Тесты</span>
    </button>
    <button onClick={() => onNavigate('export')} className={`flex flex-col items-center gap-1 w-full h-full justify-center transition-colors ${screen === 'export' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
      <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: screen === 'export' ? '"FILL" 1' : '"FILL" 0' }}>ios_share</span>
      <span className="text-[10px] font-medium">Экспорт</span>
    </button>
  </nav>
);

const TopBar = ({ onBack, screen, onNavigate }) => (
  <header className="fixed z-50 top-0 w-full border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between px-6 h-12">
    <div className="flex items-center gap-8">
      <span className="text-lg font-bold tracking-tighter text-on-surface cursor-pointer" onClick={() => onNavigate('build')}>PC-SPEC PRO</span>
      <nav className="hidden md:flex items-center gap-1 font-sans text-sm tracking-tight">
        <a 
          onClick={() => onNavigate('build')}
          className={`${screen === 'build' || screen === 'picker' ? 'text-blue-700 border-b-2 border-blue-700 font-semibold' : 'text-outline font-medium'} h-12 flex items-center px-2 cursor-pointer hover:bg-surface-container-low`}
        >Конфигурация</a>
        <a 
          onClick={() => onNavigate('benchmarks')}
          className={`${screen === 'benchmarks' ? 'text-blue-700 border-b-2 border-blue-700 font-semibold' : 'text-outline font-medium'} h-12 flex items-center px-2 cursor-pointer hover:bg-surface-container-low`}
        >Бенчмарки</a>
        <a
          onClick={() => onNavigate('export')}
          className={`${screen === 'export' ? 'text-blue-700 border-b-2 border-blue-700 font-semibold' : 'text-outline font-medium'} h-12 flex items-center px-2 cursor-pointer hover:bg-surface-container-low`}
        >Экспорт</a>
      </nav>
    </div>
    <div className="flex items-center gap-2 text-blue-700">
      {(screen === 'picker' || screen === 'benchmarks' || screen === 'export') && (
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-on-surface-variant hover:text-on-surface px-3 py-1.5 rounded hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span> Назад
        </button>
      )}
      <button onClick={() => onNavigate('settings')} className="p-1 rounded-full hover:bg-surface-container transition-colors flex items-center justify-center">
        <span className="material-symbols-outlined">settings</span>
      </button>
    </div>
  </header>
);

// ─── Screen 1: Build Overview (stitch ru_1) ─────────────────────────────────
const BuildScreen = ({ categories, build, validation, onSelectCategory, onOverview }) => {
  const totalPrice = Object.values(build).reduce((s, c) => s + (c?.price || 0), 0);

  const hasConflicts = validation.errors?.length > 0;

  return (
    <main className="flex-grow pt-20 pb-24 md:pb-16 px-4 md:px-6 flex flex-col items-center w-full">
      <div className="w-full max-w-4xl flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-semibold leading-8 tracking-tight text-on-surface mb-1">Конфигурация системы</h1>
            <p className="text-[14px] text-on-surface-variant">Выберите компоненты для вашей сборки.</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 border rounded shadow-sm ${hasConflicts ? 'border-red-200 bg-red-50' : 'border-outline-variant bg-surface-container-lowest'}`}>
            <span className={`material-symbols-outlined text-[18px] ${hasConflicts ? 'text-red-600' : 'text-primary'}`}>
              {hasConflicts ? 'error' : 'check_circle'}
            </span>
            <span className="text-[13px] font-medium text-on-surface">
              {hasConflicts ? validation.errors[0] : 'Конфликтов не обнаружено'}
            </span>
          </div>
        </div>

        {/* Slots */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg flex flex-col overflow-hidden">
          {categories.map(cat => {
            const key = categoryToKey(cat.slug);
            const selected = build[key];
            return (
              <div key={cat.id} className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 px-4 sm:px-6 py-4 border-b border-outline-variant last:border-b-0 hover:bg-surface-container-low transition-colors">
                <div className={`w-full sm:w-[140px] flex items-center gap-3 ${selected ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                  <span className="material-symbols-outlined">{getIcon(cat.slug)}</span>
                  <span className="text-[14px] font-medium">{cat.name}</span>
                </div>
                <div className="flex-1 flex flex-col">
                  {selected ? (
                    <>
                      <span className="text-[14px] font-medium text-on-surface">{selected.name}</span>
                      <span className="text-[13px] text-on-surface-variant mt-0.5">{buildDescription(selected, cat.slug)}</span>
                    </>
                  ) : (
                    <span className="text-[14px] text-outline italic">Компонент не выбран</span>
                  )}
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                  {selected && (
                    <span className="text-[14px] font-semibold text-on-surface">${selected.price.toFixed(2)}</span>
                  )}
                  <button
                    onClick={() => onSelectCategory(cat)}
                    className={`w-full sm:w-auto text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded transition-colors ${
                      selected
                        ? 'text-primary hover:bg-primary-fixed'
                        : 'border border-outline text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    {selected ? 'ЗАМЕНИТЬ' : 'ВЫБРАТЬ'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Summary */}
        <div className="flex items-center justify-between bg-surface-container-lowest border border-outline-variant rounded-lg p-6">
          <div className="flex flex-col">
            <span className="text-[13px] text-on-surface-variant">Расчетная мощность</span>
            <span className="text-[18px] font-semibold text-on-surface">
              {validation.estimatedWattage > 0 ? `${validation.estimatedWattage}W` : '—'} &nbsp;
              <span className="text-[14px] font-normal text-on-surface-variant">Итого: ${totalPrice.toFixed(2)}</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectCategory(null)}
              className="text-[13px] font-medium text-outline hover:text-red-600 px-3 py-2 flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">delete_sweep</span> Очистить
            </button>
            <button onClick={onOverview} className="bg-primary text-on-primary text-[11px] font-bold uppercase tracking-wider px-6 py-3 rounded hover:opacity-90 transition-opacity">
              ОБЗОР СБОРКИ
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

// ─── Screen 2: Component Picker (stitch ru_2) ───────────────────────────────
const PickerScreen = ({ activeCategory, build, onSelect, settings }) => {
  const [components, setComponents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [availableFilters, setAvailableFilters] = useState({ brands: [], sockets: [], formFactors: [], memoryTypes: [] });
  const [activeFilters, setActiveFilters] = useState({ brand: '', socket: '', formFactor: '', memoryType: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Load filters when category changes
  useEffect(() => {
    if (!activeCategory) return;
    getFilters(activeCategory.id).then(res => {
      setAvailableFilters({
        brands: res.data.brands || [],
        sockets: res.data.sockets || [],
        formFactors: res.data.formFactors || [],
        memoryTypes: res.data.memoryTypes || [],
      });
    }).catch(console.error);
    setActiveFilters({ brand: '', socket: '', formFactor: '', memoryType: '' });
    setSearchTerm('');
    setSortBy('');
    setPage(1);
  }, [activeCategory]);

  // Fetch components
  const fetchComponents = useCallback(async () => {
    if (!activeCategory) return;
    setIsLoading(true);
    try {
      const params = { categoryId: activeCategory.id, page, pageSize, search: searchTerm, sortBy, ...activeFilters };
      Object.keys(params).forEach(k => { if (params[k] === '' || params[k] == null) delete params[k]; });
      const res = await getComponents(params);
      let items = res.data.items || res.data;

      // Sort by preferred brands
      if (!sortBy && settings) {
         items = [...items].sort((a,b) => {
            let aPref = false;
            let bPref = false;
            if (activeCategory.slug === 'cpu') {
               aPref = (settings.cpuPrefs.amd && a.brand?.toLowerCase().includes('amd')) || (settings.cpuPrefs.intel && a.brand?.toLowerCase().includes('intel'));
               bPref = (settings.cpuPrefs.amd && b.brand?.toLowerCase().includes('amd')) || (settings.cpuPrefs.intel && b.brand?.toLowerCase().includes('intel'));
            } else if (activeCategory.slug === 'gpu') {
               aPref = (settings.gpuPrefs.nvidia && a.brand?.toLowerCase().includes('nvidia')) || (settings.gpuPrefs.amd && a.brand?.toLowerCase().includes('amd'));
               bPref = (settings.gpuPrefs.nvidia && b.brand?.toLowerCase().includes('nvidia')) || (settings.gpuPrefs.amd && b.brand?.toLowerCase().includes('amd'));
            }
            if (aPref && !bPref) return -1;
            if (!aPref && bPref) return 1;
            return 0;
         });
      }

      if (res.data.items) {
        setComponents(items);
        setTotalCount(res.data.totalCount);
      } else {
        setComponents(items);
        setTotalCount(res.data.length);
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, [activeCategory, page, searchTerm, sortBy, activeFilters, settings]);

  useEffect(() => { fetchComponents(); }, [fetchComponents]);

  const selectedComp = build[categoryToKey(activeCategory?.slug)];
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const hasFilters = Object.values(activeFilters).some(v => v !== '');

  const FilterSelect = ({ label, options, value, onChange }) => options.length === 0 ? null : (
    <select
      className="px-3 py-1 bg-surface-container-lowest border border-outline-variant text-on-surface-variant rounded-full text-[13px] hover:bg-surface-container-low transition-colors outline-none cursor-pointer"
      value={value}
      onChange={e => { onChange(e.target.value); setPage(1); }}
    >
      <option value="">{label}: Любой</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <main className="flex-1 pt-12 pb-24 md:pb-0 bg-surface overflow-y-auto w-full">
      <div className="p-4 md:p-6 w-full overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-outline-variant">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[20px] sm:text-[24px] font-semibold leading-8 tracking-tight text-on-surface">
              Выберите {activeCategory?.name?.toLowerCase()}
            </h1>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-surface-container-high text-on-surface-variant px-2 py-1 rounded">
              {totalCount} объектов
            </span>
          </div>
          <select
            className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded text-[13px] text-on-surface hover:bg-surface-container-low transition-colors outline-none cursor-pointer"
            value={sortBy}
            onChange={e => { setSortBy(e.target.value); setPage(1); }}
          >
            <option value="">Сортировка: По умолчанию</option>
            <option value="price_asc">Цена: по возрастанию</option>
            <option value="price_desc">Цена: по убыванию</option>
          </select>
        </div>

        {/* Search + Filter chips */}
        <div className="flex flex-wrap gap-2 mb-6 items-center">
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">search</span>
            <input
              className="pl-8 pr-3 py-1.5 bg-surface-container border-none rounded text-sm w-52 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-outline"
              placeholder="Поиск..."
              type="text"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>

          <span className="px-3 py-1 bg-primary-container text-on-primary-container rounded-full text-[13px] flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">filter_list</span> Фильтры
          </span>

          <FilterSelect label="Бренд" options={availableFilters.brands} value={activeFilters.brand}
            onChange={v => setActiveFilters(p => ({ ...p, brand: v }))} />
          <FilterSelect label="Сокет" options={availableFilters.sockets} value={activeFilters.socket}
            onChange={v => setActiveFilters(p => ({ ...p, socket: v }))} />
          <FilterSelect label="Форм-фактор" options={availableFilters.formFactors} value={activeFilters.formFactor}
            onChange={v => setActiveFilters(p => ({ ...p, formFactor: v }))} />
          <FilterSelect label="Тип памяти" options={availableFilters.memoryTypes} value={activeFilters.memoryType}
            onChange={v => setActiveFilters(p => ({ ...p, memoryType: v }))} />

          {hasFilters && (
            <button
              onClick={() => { setActiveFilters({ brand: '', socket: '', formFactor: '', memoryType: '' }); setPage(1); }}
              className="px-3 py-1 bg-error-container text-on-error-container rounded-full text-[13px] hover:opacity-80 transition-opacity"
            >
              Сбросить
            </button>
          )}
        </div>

        {/* Data Grid */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded flex flex-col w-full overflow-hidden">
          {/* Header row - hidden on mobile */}
          <div className="hidden md:grid grid-cols-[1fr_120px_100px_100px_80px] gap-4 px-4 py-2 border-b border-outline-variant bg-surface-container-low text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            <div>Модель</div>
            <div>Характеристики</div>
            <div className="text-right">TDP</div>
            <div className="text-right">Бренд</div>
            <div className="text-right">Цена</div>
          </div>

            {isLoading ? (
              <div className="p-8 text-center text-on-surface-variant text-[14px]">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Загрузка...
              </div>
            ) : components.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-[48px] text-outline-variant">sentiment_dissatisfied</span>
                <p className="text-[14px] text-on-surface-variant">Ничего не найдено</p>
              </div>
            ) : components.map(comp => {
              const isSelected = selectedComp?.id === comp.id;
              const compat = isCompatible(comp, build, activeCategory?.slug);

              return (
                <div
                  key={comp.id}
                  onClick={() => onSelect(comp)}
                  className={`flex flex-col md:grid md:grid-cols-[1fr_120px_100px_100px_80px] gap-3 md:gap-4 px-4 py-3 border-b border-outline-variant hover:bg-surface-container-low transition-colors md:items-center text-[13px] text-on-surface group cursor-pointer
                    ${isSelected ? 'bg-primary-fixed-dim' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <button className={`w-6 h-6 rounded flex items-center justify-center transition-colors flex-shrink-0
                      ${isSelected
                        ? 'border border-primary-container bg-primary-container text-on-primary'
                        : 'border border-outline-variant text-primary-container hover:bg-primary-container hover:text-on-primary'}`}>
                      <span className="material-symbols-outlined text-[16px]">{isSelected ? 'check' : 'add'}</span>
                    </button>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[14px] font-semibold text-on-surface leading-tight truncate">{comp.name}</span>
                      <span className="text-[10px] text-on-surface-variant mt-0.5">{comp.categoryName}</span>
                    </div>
                    {!compat && !isSelected && (
                      <span className="ml-2 px-1.5 py-0.5 bg-error-container text-on-error-container rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                        <span className="material-symbols-outlined text-[12px]">warning</span> Несовм.
                      </span>
                    )}
                    {isSelected && (
                      <span className="ml-2 px-1.5 py-0.5 bg-surface-container-highest text-on-surface rounded text-[10px] font-bold uppercase tracking-wider border border-outline-variant whitespace-nowrap flex-shrink-0">
                        Выбрано
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:contents gap-y-3 gap-x-2 mt-1 md:mt-0 text-[12px] md:text-[11px]">
                    <div className="flex flex-col gap-0.5 text-on-surface-variant">
                      <span className="md:hidden text-[10px] text-outline font-bold uppercase mb-0.5 tracking-wider">Характеристики</span>
                      {comp.socket && comp.socket !== 'N/A' && <span>{comp.socket}</span>}
                      {comp.memoryType && comp.memoryType !== 'N/A' && <span>{comp.memoryType}</span>}
                      {comp.formFactor && comp.formFactor !== 'N/A' && <span>{comp.formFactor}</span>}
                      {!comp.socket && !comp.memoryType && !comp.formFactor && <span>—</span>}
                    </div>

                    <div className="flex flex-col md:text-right font-mono text-on-surface-variant">
                      <span className="md:hidden text-[10px] text-outline font-bold uppercase mb-0.5 font-sans tracking-wider">TDP</span>
                      {comp.tdp > 0 ? `${comp.tdp}W` : '—'}
                    </div>
                    <div className="flex flex-col md:text-right font-mono text-on-surface-variant">
                      <span className="md:hidden text-[10px] text-outline font-bold uppercase mb-0.5 font-sans tracking-wider">Бренд</span>
                      {comp.brand || '—'}
                    </div>
                    <div className="flex flex-col md:text-right font-semibold text-[14px] text-on-surface">
                      <span className="md:hidden text-[10px] text-outline font-bold uppercase mb-0.5 font-sans tracking-wider">Цена</span>
                      {comp.price > 0 ? `$${comp.price.toFixed(2)}` : '—'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 mb-8 text-on-surface-variant text-[13px]">
          <div>
            Показано {Math.min((page - 1) * pageSize + 1, totalCount)}–{Math.min(page * pageSize, totalCount)} из {totalCount}
          </div>
          <div className="flex gap-1 items-center">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2 py-1 rounded hover:bg-surface-container-low transition-colors disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="px-3 py-1 rounded bg-primary-container text-on-primary">{page}</span>
            <span className="px-2">из {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2 py-1 rounded hover:bg-surface-container-low transition-colors disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

// ─── Screen 3: Benchmarks (stitch ru_3) ───────────────────────────────────
const BenchmarksScreen = ({ build, benchmarks, scenarios }) => {
  const cpu = build.cpu;
  const gpu = build.gpu;

  const filterByCompId = (list, id) => {
    if (!id || !Array.isArray(list)) return [];
    return list.filter(b => (b.pcComponentId ?? b.PcComponentId) === id);
  };

  const cpuBenches = filterByCompId(benchmarks, cpu?.id);
  const gpuBenches = filterByCompId(benchmarks, gpu?.id);
  const ramBenches = filterByCompId(benchmarks, build.ram?.id);
  const storageBenches = filterByCompId(benchmarks, build.storage?.id);

  const getScore = (list, type) => {
    const b = list.find(item => item.type?.toLowerCase().includes(type.toLowerCase()));
    return b?.score ?? b?.Score ?? '—';
  };
  const getUnit = (list, type) => {
    const b = list.find(item => item.type?.toLowerCase().includes(type.toLowerCase()));
    return b?.unit ?? b?.Unit ?? '';
  };

  return (
    <main className="flex-grow pt-20 pb-16 px-6 flex flex-col items-center w-full max-w-[1400px] mx-auto">
      {/* Header Section */}
      <header className="mb-8 flex flex-col gap-2 w-full">
        <h1 className="text-[24px] font-semibold leading-8 tracking-tight text-on-surface">Результаты тестирования</h1>
        <p className="text-[14px] text-on-surface-variant max-w-2xl">Анализ производительности текущей конфигурации в различных вычислительных сценариях. Данные смоделированы на основе спецификаций выбранных компонентов.</p>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full">
        {/* CPU Performance */}
        <section className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-lg p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[18px] font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-700">memory</span>
              Вычислительная мощность (CPU)
            </h2>
            <span className="bg-surface-container text-on-surface-variant text-[11px] font-bold uppercase px-2 py-1 rounded">
              {cpu?.name ?? 'ПРОЦЕССОР НЕ ВЫБРАН'}
            </span>
          </div>
          
          <div className="flex flex-col gap-6">
            {scenarios.filter(s => s.category === 'CPU').map(s => {
              const score = getScore(cpuBenches, s.name);
              return (
                <div key={s.id} className="group flex flex-col gap-1">
                  <div className="flex justify-between text-[13px] text-on-surface">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline-variant">{s.icon || 'analytics'}</span>
                      {s.name}
                    </span>
                    <span className="font-mono text-blue-700 font-bold">{score} {score !== '—' ? (s.unit || getUnit(cpuBenches, s.name)) : ''}</span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-700 h-full rounded-full transition-all duration-500" style={{ width: score === '—' ? '0%' : '85%' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Memory / Storage - Spans 4 cols */}
        <section className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-lg p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-outline">database</span>
            <h2 className="text-[18px] font-semibold text-on-surface">Подсистема памяти</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-auto">
            {[
              { label: 'ЧТЕНИЕ (NVMe)', value: getScore(storageBenches, 'Read'), unit: 'MB/s' },
              { label: 'ЗАПИСЬ (NVMe)', value: getScore(storageBenches, 'Write'), unit: 'MB/s' },
              { label: 'ПРОПУСК. (RAM)', value: getScore(ramBenches, 'Bandwidth'), unit: 'GB/s' },
              { label: 'ЗАДЕРЖКА (RAM)', value: getScore(ramBenches, 'Latency'), unit: 'ns' }
            ].map(m => (
              <div key={m.label} className="bg-surface-container-low border border-outline-variant rounded p-3 flex flex-col gap-1">
                <span className="text-[11px] font-bold uppercase text-outline">{m.label}</span>
                <span className="font-mono text-on-surface text-lg font-bold">
                  {m.value} <span className="text-xs font-normal text-outline">{m.value === '—' ? '' : m.unit}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* GPU Gaming Performance - Spans 12 cols */}
        <section className="lg:col-span-12 bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden mt-4 shadow-sm">
          <div className="p-4 sm:p-6 border-b border-outline-variant flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface-container-low">
            <h2 className="text-[16px] sm:text-[18px] font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-700">dns</span>
              Графическая производительность
            </h2>
            <span className="bg-surface-container text-on-surface-variant text-[11px] font-bold uppercase px-2 py-1 rounded inline-block w-full sm:w-auto text-left sm:text-center break-words whitespace-normal leading-tight">
              {gpu?.name ?? 'ВИДЕОКАРТА НЕ ВЫБРАНА'}
            </span>
          </div>
          <div className="w-full">
            <div className="hidden sm:grid grid-cols-[1fr_120px_140px] border-b border-outline-variant bg-surface-container-low text-[11px] font-bold uppercase text-outline">
              <div className="p-3">Сценарий / Приложение</div>
              <div className="p-3">Результат</div>
              <div className="p-3 text-right">Статус</div>
            </div>
            <div className="flex flex-col text-[13px]">
              {scenarios.filter(s => s.category === 'GPU').map((s, idx, arr) => {
                 const score = getScore(gpuBenches, s.name);
                 const isFast = score !== '—' && (s.unit === 'FPS' ? parseFloat(score) > 60 : parseFloat(score) < 15);
                 const status = isFast ? 'Быстро' : 'Оптимально';
                 const statusColor = isFast ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700';
                 const icon = isFast ? 'bolt' : 'check_circle';
                 
                 return (
                  <div key={s.id} className={`flex flex-col sm:grid sm:grid-cols-[1fr_120px_140px] items-start sm:items-center p-4 sm:p-0 ${idx !== arr.length - 1 ? 'border-b border-outline-variant' : ''} hover:bg-surface-container-low transition-colors gap-2 sm:gap-0`}>
                    <div className="sm:p-3 text-on-surface font-semibold sm:font-normal w-full">{s.name}</div>
                    <div className="sm:p-3 font-mono text-blue-700 font-bold w-full">{score} {score !== '—' ? (s.unit || getUnit(gpuBenches, s.name)) : ''}</div>
                    <div className="sm:p-3 text-left sm:text-right w-full">
                      {score !== '—' && (
                        <span className={`inline-flex items-center gap-1 ${statusColor} px-2 py-0.5 rounded text-xs font-medium`}>
                          <span className="material-symbols-outlined text-[14px]">{s.icon || icon}</span>
                          {status}
                        </span>
                      )}
                    </div>
                  </div>
                 );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

// ─── Screen 4: Export (stitch ru_4) ─────────────────────────────────────────
const ExportScreen = ({ build, categories }) => {
  const [copyStates, setCopyStates] = useState({});
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  const selectedSlots = categories
    .filter(cat => build[categoryToKey(cat.slug)])
    .map(cat => ({ cat, comp: build[categoryToKey(cat.slug)] }));

  const totalPrice = Object.values(build).reduce((s, c) => s + (c?.price || 0), 0);

  const flash = (key) => {
    setCopyStates(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setCopyStates(prev => ({ ...prev, [key]: false })), 2000);
  };

  const buildMarkdown = () => {
    const lines = ['## Сборка PC Builder', ''];
    const catLabels = { cpu: 'Процессор', motherboard: 'Материнская плата', ram: 'Оперативная память', gpu: 'Видеокарта', storage: 'Накопитель', psu: 'Блок питания' };
    selectedSlots.forEach(({ cat, comp }) => {
      const key = categoryToKey(cat.slug);
      const desc = buildDescription(comp, key);
      lines.push(`- **${catLabels[key] ?? cat.name}:** ${comp.name}${desc ? ` (${desc})` : ''}`);
    });
    if (totalPrice > 0) lines.push('', `**Итого:** $${totalPrice.toFixed(2)}`);
    return lines.join('\n');
  };

  const buildBBCode = () => {
    const catLabels = { cpu: 'Процессор', motherboard: 'Материнская плата', ram: 'Оперативная память', gpu: 'Видеокарта', storage: 'Накопитель', psu: 'Блок питания' };
    const items = selectedSlots.map(({ cat, comp }) => {
      const key = categoryToKey(cat.slug);
      const desc = buildDescription(comp, key);
      return `[*][b]${catLabels[key] ?? cat.name}:[/b] ${comp.name}${desc ? ` (${desc})` : ''}`;
    });
    return `[b]Сборка PC Builder[/b]\n\n[list]\n${items.join('\n')}\n[/list]${totalPrice > 0 ? `\n\n[b]Итого:[/b] $${totalPrice.toFixed(2)}` : ''}`;
  };

  const handleCopyLink = async () => {
    if (isGeneratingLink) return;
    setIsGeneratingLink(true);
    try {
      const request = {
        name: 'Моя сборка',
        cpuId: build.cpu?.id ?? null,
        motherboardId: build.motherboard?.id ?? null,
        ramId: build.ram?.id ?? null,
        gpuId: build.gpu?.id ?? null,
        storageId: build.storage?.id ?? null,
        psuId: build.psu?.id ?? null,
      };
      const res = await saveBuild(request);
      const shareUrl = `${window.location.origin}${window.location.pathname}?share=${res.data.shareCode}`;
      await navigator.clipboard.writeText(shareUrl);
      flash('link');
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(buildMarkdown());
    flash('text');
  };

  const handleCopyBBCode = async () => {
    await navigator.clipboard.writeText(buildBBCode());
    flash('bbcode');
  };

  const handlePrint = () => window.print();

  const exportCards = [
    {
      key: 'link',
      icon: 'link',
      title: 'Ссылка',
      desc: 'Сохраните сборку и поделитесь ссылкой',
      action: isGeneratingLink ? 'ГЕНЕРАЦИЯ...' : (copyStates.link ? 'СКОПИРОВАНО ✓' : 'СКОПИРОВАТЬ ССЫЛКУ'),
      onClick: handleCopyLink,
      color: 'from-blue-600 to-blue-800',
      bg: 'bg-[var(--color-export-link-bg)]',
      border: 'border-[var(--color-export-link-border)]',
      iconColor: 'text-[var(--color-export-link-text)]',
    },
    {
      key: 'pdf',
      icon: 'picture_as_pdf',
      title: 'PDF',
      desc: 'Распечатайте или сохраните как PDF',
      action: 'СКАЧАТЬ PDF',
      onClick: handlePrint,
      color: 'from-red-600 to-red-800',
      bg: 'bg-[var(--color-export-pdf-bg)]',
      border: 'border-[var(--color-export-pdf-border)]',
      iconColor: 'text-[var(--color-export-pdf-text)]',
    },
    {
      key: 'text',
      icon: 'subject',
      title: 'Текст',
      desc: 'Markdown для Reddit, GitHub и др.',
      action: copyStates.text ? 'СКОПИРОВАНО ✓' : 'СКОПИРОВАТЬ ТЕКСТ',
      onClick: handleCopyText,
      color: 'from-emerald-600 to-emerald-800',
      bg: 'bg-[var(--color-export-txt-bg)]',
      border: 'border-[var(--color-export-txt-border)]',
      iconColor: 'text-[var(--color-export-txt-text)]',
    },
    {
      key: 'bbcode',
      icon: 'forum',
      title: 'Форум',
      desc: 'BBCode для форумов и сообществ',
      action: copyStates.bbcode ? 'СКОПИРОВАНО ✓' : 'КОД ДЛЯ ФОРУМА',
      onClick: handleCopyBBCode,
      color: 'from-violet-600 to-violet-800',
      bg: 'bg-[var(--color-export-bbcode-bg)]',
      border: 'border-[var(--color-export-bbcode-border)]',
      iconColor: 'text-[var(--color-export-bbcode-text)]',
    },
  ];

  const catLabels = { cpu: 'ПРОЦЕССОР', motherboard: 'МАТЕРИНСКАЯ ПЛАТА', ram: 'ОЗУ', gpu: 'ВИДЕОКАРТА', storage: 'НАКОПИТЕЛЬ', psu: 'БП' };

  return (
    <main className="flex-grow pt-20 pb-16 px-6 flex flex-col items-center w-full">
      <div className="w-full max-w-5xl flex flex-col gap-8">
        {/* Header */}
        <div>
          <h1 className="text-[24px] font-semibold leading-8 tracking-tight text-on-surface mb-1">Экспорт конфигурации</h1>
          <p className="text-[14px] text-on-surface-variant">Выберите формат для сохранения или публикации вашей сборки.</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Left: Export Cards */}
          <div className="export-cards flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {exportCards.map(card => (
                <div
                  key={card.key}
                  className={`${card.bg} border ${card.border} rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-all duration-200 group`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center shadow-sm`}>
                      <span className="material-symbols-outlined text-white text-[20px]">{card.icon}</span>
                    </div>
                    <div>
                      <div className="text-[15px] font-semibold text-on-surface">{card.title}</div>
                      <div className="text-[12px] text-on-surface-variant leading-tight">{card.desc}</div>
                    </div>
                  </div>
                  <button
                    id={`export-btn-${card.key}`}
                    onClick={card.onClick}
                    className={`mt-auto w-full text-[11px] font-bold uppercase tracking-wider py-2.5 px-4 rounded-lg border ${card.border} ${card.iconColor} hover:bg-surface-container-lowest/80 transition-all duration-150 flex items-center justify-center gap-2`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copyStates[card.key] ? 'check' : card.icon}
                    </span>
                    {card.action}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Build Summary */}
          <div className="build-summary bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <span className="text-[13px] font-bold uppercase tracking-wider text-on-surface">Сводка компонентов</span>
              <span className="text-[11px] font-bold bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded">
                {selectedSlots.length} ЭЛ.
              </span>
            </div>

            {selectedSlots.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-on-surface-variant">
                <span className="material-symbols-outlined text-[40px] text-outline-variant">inventory_2</span>
                <p className="text-[13px]">Компоненты не выбраны</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {selectedSlots.map(({ cat, comp }) => {
                  const key = categoryToKey(cat.slug);
                  const desc = buildDescription(comp, key);
                  return (
                    <div key={cat.id} className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                        {catLabels[key] ?? cat.name.toUpperCase()}
                      </span>
                      <span className="text-[13px] font-medium text-on-surface leading-tight">{comp.name}</span>
                      {desc && <span className="text-[11px] text-on-surface-variant">{desc}</span>}
                      <span className="text-[12px] font-semibold text-primary">${comp.price.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {totalPrice > 0 && (
              <div className="border-t border-outline-variant pt-3 flex items-center justify-between">
                <span className="text-[13px] text-on-surface-variant">Итого</span>
                <span className="text-[16px] font-bold text-on-surface">${totalPrice.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Print-only summary */}
        <div className="print-only hidden">
          <h2 className="text-[20px] font-bold mb-4">Сборка PC Builder</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {selectedSlots.map(({ cat, comp }) => {
                const key = categoryToKey(cat.slug);
                const desc = buildDescription(comp, key);
                const catLabelsRu = { cpu: 'Процессор', motherboard: 'Материнская плата', ram: 'ОЗУ', gpu: 'Видеокарта', storage: 'Накопитель', psu: 'Блок питания' };
                return (
                  <tr key={cat.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold', width: '160px' }}>{catLabelsRu[key] ?? cat.name}</td>
                    <td style={{ padding: '8px' }}>{comp.name}{desc ? ` — ${desc}` : ''}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>${comp.price.toFixed(2)}</td>
                  </tr>
                );
              })}
              {totalPrice > 0 && (
                <tr>
                  <td colSpan={2} style={{ padding: '8px', fontWeight: 'bold', textAlign: 'right' }}>Итого:</td>
                  <td style={{ padding: '8px', fontWeight: 'bold', textAlign: 'right' }}>${totalPrice.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

// ─── Screen 5: Settings  ─────────────────────────────────────
const SettingsScreen = ({ onSave, onCancel, currentSettings }) => {
  const [theme, setTheme] = useState(currentSettings.theme || 'light');
  const [cpuPrefs, setCpuPrefs] = useState(currentSettings.cpuPrefs || { amd: true, intel: false });
  const [gpuPrefs, setGpuPrefs] = useState(currentSettings.gpuPrefs || { nvidia: true, amd: false });
  const [notifications, setNotifications] = useState(currentSettings.notifications || { tdp: true });

  const handleSave = () => {
    onSave({ theme, cpuPrefs, gpuPrefs, notifications });
  };

  return (
    <main className="flex-grow pt-20 pb-16 px-6 flex justify-center w-full">
      <div className="w-full max-w-4xl">
        <h1 className="font-headline-lg text-[24px] font-semibold text-on-surface mb-8">Настройки системы</h1>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <aside className="md:col-span-3">
            <nav className="flex flex-col gap-1">
              <a className="px-3 py-2 rounded bg-surface-container-high text-on-surface text-[13px] font-medium flex items-center gap-2" href="#interface">
                <span className="material-symbols-outlined text-[18px]">desktop_windows</span> Интерфейс
              </a>
              <a className="px-3 py-2 rounded text-on-surface-variant hover:bg-surface-container hover:text-on-surface text-[13px] font-medium flex items-center gap-2 transition-colors" href="#preferences">
                <span className="material-symbols-outlined text-[18px]">favorite</span> Предпочтения
              </a>
              <a className="px-3 py-2 rounded text-on-surface-variant hover:bg-surface-container hover:text-on-surface text-[13px] font-medium flex items-center gap-2 transition-colors" href="#notifications">
                <span className="material-symbols-outlined text-[18px]">notifications</span> Уведомления
              </a>
            </nav>
          </aside>
          <div className="md:col-span-9 flex flex-col gap-8">
            <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6" id="interface">
              <h2 className="text-[18px] font-semibold text-on-surface mb-6 border-b border-surface-variant pb-2">Интерфейс</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">ТЕМА ОФОРМЛЕНИЯ</label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`flex items-center p-3 border rounded cursor-pointer transition-colors ${theme === 'light' ? 'border-primary text-primary bg-primary-fixed-dim' : 'border-outline-variant text-on-surface hover:bg-surface-container-low'}`}>
                      <input type="radio" name="theme" value="light" checked={theme === 'light'} onChange={() => setTheme('light')} className="form-radio text-primary border-outline-variant focus:ring-primary h-4 w-4" />
                      <span className="ml-2 text-[13px] font-medium">Светлая</span>
                    </label>
                    <label className={`flex items-center p-3 border rounded cursor-pointer transition-colors ${theme === 'dark' ? 'border-primary text-primary bg-primary-fixed-dim' : 'border-outline-variant text-on-surface hover:bg-surface-container-low'}`}>
                      <input type="radio" name="theme" value="dark" checked={theme === 'dark'} onChange={() => setTheme('dark')} className="form-radio text-primary border-outline-variant focus:ring-primary h-4 w-4" />
                      <span className="ml-2 text-[13px] font-medium">Темная</span>
                    </label>
                  </div>
                </div>
              </div>
            </section>
            <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6" id="preferences">
              <h2 className="text-[18px] font-semibold text-on-surface mb-6 border-b border-surface-variant pb-2">Предпочтения по брендам</h2>
              <p className="text-[13px] text-on-surface-variant mb-4">Выберите предпочитаемых производителей. Система будет отдавать им приоритет при автоматическом подборе конфигурации.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-outline-variant rounded p-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-3">ПРОЦЕССОРЫ</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" checked={cpuPrefs.amd} onChange={(e) => setCpuPrefs(p => ({ ...p, amd: e.target.checked }))} className="form-checkbox text-primary border-outline-variant rounded focus:ring-primary h-4 w-4" />
                      <span className="ml-2 text-[13px] text-on-surface">AMD</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" checked={cpuPrefs.intel} onChange={(e) => setCpuPrefs(p => ({ ...p, intel: e.target.checked }))} className="form-checkbox text-primary border-outline-variant rounded focus:ring-primary h-4 w-4" />
                      <span className="ml-2 text-[13px] text-on-surface">Intel</span>
                    </label>
                  </div>
                </div>
                <div className="border border-outline-variant rounded p-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-3">ВИДЕОКАРТЫ</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" checked={gpuPrefs.nvidia} onChange={(e) => setGpuPrefs(p => ({ ...p, nvidia: e.target.checked }))} className="form-checkbox text-primary border-outline-variant rounded focus:ring-primary h-4 w-4" />
                      <span className="ml-2 text-[13px] text-on-surface">NVIDIA</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" checked={gpuPrefs.amd} onChange={(e) => setGpuPrefs(p => ({ ...p, amd: e.target.checked }))} className="form-checkbox text-primary border-outline-variant rounded focus:ring-primary h-4 w-4" />
                      <span className="ml-2 text-[13px] text-on-surface">AMD Radeon</span>
                    </label>
                  </div>
                </div>
              </div>
            </section>
            <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6" id="notifications">
              <h2 className="text-[18px] font-semibold text-on-surface mb-6 border-b border-surface-variant pb-2">Уведомления о совместимости</h2>
              <div className="space-y-4">
                <label className="flex items-start">
                  <div className="flex items-center h-5">
                    <input type="checkbox" checked={notifications.tdp} onChange={(e) => setNotifications(p => ({ ...p, tdp: e.target.checked }))} className="form-checkbox text-primary border-outline-variant rounded focus:ring-primary h-4 w-4 mt-0.5" />
                  </div>
                  <div className="ml-3">
                    <span className="block text-[13px] text-on-surface font-semibold">Строгая проверка TDP</span>
                    <span className="block text-[13px] text-on-surface-variant mt-1">Предупреждать, если суммарное TDP комплектующих превышает 80% мощности блока питания.</span>
                  </div>
                </label>
              </div>
            </section>
            <div className="flex justify-end gap-4 mt-4">
              <button onClick={onCancel} className="px-4 py-2 border border-outline-variant text-on-surface text-[13px] font-medium rounded hover:bg-surface-container-low transition-colors">Отмена</button>
              <button onClick={handleSave} className="px-4 py-2 bg-primary-container text-on-primary-container text-[13px] font-medium rounded hover:bg-primary hover:text-on-primary transition-colors">Сохранить изменения</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

// ─── Root App ────────────────────────────────────────────────────────────────
const App = () => {
  const [categories, setCategories] = useState([]);
  const [build, setBuild] = useState({ cpu: null, motherboard: null, ram: null, gpu: null, storage: null, psu: null });
  const [validation, setValidation] = useState({ isCompatible: true, errors: [], warnings: [], estimatedWattage: 0 });
  const [benchmarks, setBenchmarks] = useState([]);
  const [scenarios, setScenarios] = useState([]);

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('pcbuilder_settings');
    return saved ? JSON.parse(saved) : { 
      theme: 'light', 
      cpuPrefs: { amd: true, intel: false }, 
      gpuPrefs: { nvidia: true, amd: false },
      notifications: { tdp: true }
    };
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings.theme]);

  // screen: 'build' | 'picker' | 'benchmarks' | 'export' | 'settings'
  const [screen, setScreen] = useState('build');
  const [activeCategory, setActiveCategory] = useState(null);
  const [isAdmin, setIsAdmin] = useState(window.location.pathname === '/admin');

  useEffect(() => {
    const handlePathChange = () => setIsAdmin(window.location.pathname === '/admin');
    window.addEventListener('popstate', handlePathChange);
    return () => window.removeEventListener('popstate', handlePathChange);
  }, []);

  useEffect(() => {
    getCategories().then(res => setCategories(res.data)).catch(console.error);
    getScenarios().then(res => setScenarios(res.data)).catch(console.error);
  }, []);

  // Load build from share code URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareCode = params.get('share');
    if (shareCode) {
      getBuildByShareCode(shareCode).then(res => {
        const data = res.data;
        setBuild({
          cpu: data.cpu,
          motherboard: data.motherboard,
          ram: data.ram,
          gpu: data.gpu,
          storage: data.storage,
          psu: data.psu,
        });
      }).catch(console.error);
    }
  }, []);

  // Validate build whenever it changes
  useEffect(() => {
    const request = {
      cpuId: build.cpu?.id, motherboardId: build.motherboard?.id, ramId: build.ram?.id,
      gpuId: build.gpu?.id, storageId: build.storage?.id, psuId: build.psu?.id
    };
    validateBuild(request).then(res => {
      let data = res.data;
      if (settings.notifications.tdp && build.psu && build.psu.specsJson) {
         try {
           const s = JSON.parse(build.psu.specsJson);
           const psuWattage = s.wattage || 0;
           const estWattage = data.estimatedWattage || 0;
           if (psuWattage > 0 && estWattage > psuWattage * 0.8) {
              data.errors = [...(data.errors || []), `Суммарное TDP превышает 80% мощности блока питания (${estWattage}W > ${psuWattage * 0.8}W)`];
              data.isCompatible = false;
           }
         } catch(e) {}
      }
      setValidation(data);
    }).catch(() => {});
    
    // Also fetch benchmarks
    if (request.cpuId || request.gpuId || request.ramId || request.storageId) {
      getBenchmarks(request).then(res => {
        let data = res.data;
        if (data && typeof data === 'object' && data.value) data = data.value;
        setBenchmarks(Array.isArray(data) ? data : []);
      }).catch(() => {
        setBenchmarks([]);
      });
    } else {
      setBenchmarks([]);
    }
  }, [build]);

  const handleSelectCategory = (cat) => {
    if (cat === null) {
      // Clear build
      setBuild({ cpu: null, motherboard: null, ram: null, gpu: null, storage: null, psu: null });
      return;
    }
    setActiveCategory(cat);
    setScreen('picker');
  };

  const handleSelectComponent = (comp) => {
    const key = categoryToKey(activeCategory.slug);
    setBuild(prev => ({ ...prev, [key]: build[key]?.id === comp.id ? null : comp }));
    setScreen('build');
  };

  const handleBack = () => {
    if (screen === 'benchmarks') {
      setScreen('build');
    } else {
      setScreen('build');
      setActiveCategory(null);
    }
  };

    const handleNavigate = (s) => {
    setScreen(s);
    if (s === 'build') setActiveCategory(null);
  };

  if (isAdmin) return <AdminApp />;

    return (
      <div className="bg-surface text-on-surface min-h-screen flex flex-col" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <TopBar screen={screen} onBack={handleBack} onNavigate={handleNavigate} />
        {screen !== 'settings' && <BottomNav screen={screen} onNavigate={handleNavigate} />}
  
        {screen === 'build' ? (
          <BuildScreen
            categories={categories}
            build={build}
            validation={validation}
            onSelectCategory={handleSelectCategory}
            onOverview={() => handleNavigate('benchmarks')}
          />
        ) : screen === 'picker' ? (
          <PickerScreen
            activeCategory={activeCategory}
            build={build}
            onSelect={handleSelectComponent}
            settings={settings}
          />
        ) : screen === 'export' ? (
          <ExportScreen
            build={build}
            categories={categories}
          />
        ) : screen === 'settings' ? (
          <SettingsScreen 
            currentSettings={settings}
            onSave={(newSettings) => {
              setSettings(newSettings);
              localStorage.setItem('pcbuilder_settings', JSON.stringify(newSettings));
              handleNavigate('build');
            }}
            onCancel={() => handleNavigate('build')}
          />
        ) : (
          <BenchmarksScreen 
            build={build}
            benchmarks={benchmarks}
            scenarios={scenarios}
          />
        )}
      </div>
    );
  };

export default App;
