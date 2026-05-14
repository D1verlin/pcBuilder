import React, { useState, useEffect, useCallback } from 'react';
import { getCategories, getComponents, getFilters, validateBuild, getBenchmarks, getScenarios } from './api';
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
const TopBar = ({ onBack, screen, onNavigate }) => (
  <header className="fixed z-50 top-0 w-full border-b border-slate-200 bg-white flex items-center justify-between px-6 h-12">
    <div className="flex items-center gap-8">
      <span className="text-lg font-bold tracking-tighter text-slate-900 cursor-pointer" onClick={() => onNavigate('build')}>PC-SPEC PRO</span>
      <nav className="hidden md:flex items-center gap-1 font-sans text-sm tracking-tight">
        <a 
          onClick={() => onNavigate('build')}
          className={`${screen === 'build' || screen === 'picker' ? 'text-blue-700 border-b-2 border-blue-700 font-semibold' : 'text-slate-500 font-medium'} h-12 flex items-center px-2 cursor-pointer hover:bg-slate-50`}
        >Конфигурация</a>
        <a className="text-slate-500 font-medium h-12 flex items-center px-2 hover:bg-slate-50 cursor-pointer">Совместимость</a>
        <a 
          onClick={() => onNavigate('benchmarks')}
          className={`${screen === 'benchmarks' ? 'text-blue-700 border-b-2 border-blue-700 font-semibold' : 'text-slate-500 font-medium'} h-12 flex items-center px-2 cursor-pointer hover:bg-slate-50`}
        >Бенчмарки</a>
        <a className="text-slate-500 font-medium h-12 flex items-center px-2 hover:bg-slate-50 cursor-pointer">Экспорт</a>
      </nav>
    </div>
    <div className="flex items-center gap-2 text-blue-700">
      {(screen === 'picker' || screen === 'benchmarks') && (
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded hover:bg-slate-100 transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span> Назад
        </button>
      )}
      <button className="p-1 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center">
        <span className="material-symbols-outlined">settings</span>
      </button>
    </div>
  </header>
);

// ─── Screen 1: Build Overview (stitch ru_1) ─────────────────────────────────
const BuildScreen = ({ categories, build, validation, onSelectCategory }) => {
  const totalPrice = Object.values(build).reduce((s, c) => s + (c?.price || 0), 0);

  const hasConflicts = validation.errors?.length > 0;

  return (
    <main className="flex-grow pt-20 pb-16 px-6 flex flex-col items-center w-full">
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
              <div key={cat.id} className="grid grid-cols-[140px_1fr_auto] gap-6 items-center px-6 py-4 border-b border-outline-variant last:border-b-0 hover:bg-surface-container-low transition-colors">
                <div className={`flex items-center gap-3 ${selected ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                  <span className="material-symbols-outlined">{getIcon(cat.slug)}</span>
                  <span className="text-[14px] font-medium">{cat.name}</span>
                </div>
                <div className="flex flex-col">
                  {selected ? (
                    <>
                      <span className="text-[14px] font-medium text-on-surface">{selected.name}</span>
                      <span className="text-[13px] text-on-surface-variant mt-0.5">{buildDescription(selected, cat.slug)}</span>
                    </>
                  ) : (
                    <span className="text-[14px] text-outline italic">Компонент не выбран</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {selected && (
                    <span className="text-[14px] font-semibold text-on-surface">${selected.price.toFixed(2)}</span>
                  )}
                  <button
                    onClick={() => onSelectCategory(cat)}
                    className={`text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded transition-colors ${
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
              className="text-[13px] font-medium text-slate-500 hover:text-red-600 px-3 py-2 flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">delete_sweep</span> Очистить
            </button>
            <button className="bg-primary text-on-primary text-[11px] font-bold uppercase tracking-wider px-6 py-3 rounded hover:opacity-90 transition-opacity">
              ОБЗОР СБОРКИ
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

// ─── Screen 2: Component Picker (stitch ru_2) ───────────────────────────────
const PickerScreen = ({ activeCategory, build, onSelect }) => {
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
      if (res.data.items) {
        setComponents(res.data.items);
        setTotalCount(res.data.totalCount);
      } else {
        setComponents(res.data);
        setTotalCount(res.data.length);
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, [activeCategory, page, searchTerm, sortBy, activeFilters]);

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
    <main className="flex-1 pt-12 bg-surface overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-outline-variant">
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-semibold leading-8 tracking-tight text-on-surface">
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
            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input
              className="pl-8 pr-3 py-1.5 bg-slate-100 border-none rounded text-sm w-52 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-500"
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
        <div className="bg-surface-container-lowest border border-outline-variant rounded flex flex-col">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_120px_100px_100px_80px] gap-4 px-4 py-2 border-b border-outline-variant bg-surface-container-low text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
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
              <span className="material-symbols-outlined text-[48px] text-slate-300">sentiment_dissatisfied</span>
              <p className="text-[14px] text-on-surface-variant">Ничего не найдено</p>
            </div>
          ) : components.map(comp => {
            const isSelected = selectedComp?.id === comp.id;
            const compat = isCompatible(comp, build, activeCategory?.slug);

            return (
              <div
                key={comp.id}
                onClick={() => onSelect(comp)}
                className={`grid grid-cols-[1fr_120px_100px_100px_80px] gap-4 px-4 py-3 border-b border-outline-variant hover:bg-surface-container-low transition-colors items-center text-[13px] text-on-surface group cursor-pointer
                  ${isSelected ? 'bg-blue-50' : ''}`}
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

                <div className="flex flex-col gap-0.5 text-on-surface-variant text-[11px]">
                  {comp.socket && comp.socket !== 'N/A' && <span>{comp.socket}</span>}
                  {comp.memoryType && comp.memoryType !== 'N/A' && <span>{comp.memoryType}</span>}
                  {comp.formFactor && comp.formFactor !== 'N/A' && <span>{comp.formFactor}</span>}
                  {!comp.socket && !comp.memoryType && !comp.formFactor && <span>—</span>}
                </div>

                <div className="text-right text-[11px] font-mono text-on-surface-variant">{comp.tdp > 0 ? `${comp.tdp}W` : '—'}</div>
                <div className="text-right text-[11px] font-mono text-on-surface-variant">{comp.brand || '—'}</div>
                <div className="text-right text-[14px] font-semibold text-on-surface">
                  {comp.price > 0 ? `$${comp.price.toFixed(2)}` : '—'}
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
        <section className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[18px] font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-700">memory</span>
              Вычислительная мощность (CPU)
            </h2>
            <span className="bg-slate-100 text-slate-600 text-[11px] font-bold uppercase px-2 py-1 rounded">
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
                      <span className="material-symbols-outlined text-[16px] text-slate-400">{s.icon || 'analytics'}</span>
                      {s.name}
                    </span>
                    <span className="font-mono text-blue-700 font-bold">{score} {score !== '—' ? (s.unit || getUnit(cpuBenches, s.name)) : ''}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-700 h-full rounded-full transition-all duration-500" style={{ width: score === '—' ? '0%' : '85%' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Memory / Storage - Spans 4 cols */}
        <section className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-slate-500">database</span>
            <h2 className="text-[18px] font-semibold text-on-surface">Подсистема памяти</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-auto">
            {[
              { label: 'ЧТЕНИЕ (NVMe)', value: getScore(storageBenches, 'Read'), unit: 'MB/s' },
              { label: 'ЗАПИСЬ (NVMe)', value: getScore(storageBenches, 'Write'), unit: 'MB/s' },
              { label: 'ПРОПУСК. (RAM)', value: getScore(ramBenches, 'Bandwidth'), unit: 'GB/s' },
              { label: 'ЗАДЕРЖКА (RAM)', value: getScore(ramBenches, 'Latency'), unit: 'ns' }
            ].map(m => (
              <div key={m.label} className="bg-slate-50 border border-slate-100 rounded p-3 flex flex-col gap-1">
                <span className="text-[11px] font-bold uppercase text-slate-500">{m.label}</span>
                <span className="font-mono text-on-surface text-lg font-bold">
                  {m.value} <span className="text-xs font-normal text-slate-500">{m.value === '—' ? '' : m.unit}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* GPU Gaming Performance - Spans 12 cols */}
        <section className="lg:col-span-12 bg-white border border-slate-200 rounded-lg overflow-hidden mt-4 shadow-sm">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <h2 className="text-[18px] font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-700">dns</span>
              Графическая производительность (GPU)
            </h2>
            <span className="bg-slate-100 text-slate-600 text-[11px] font-bold uppercase px-2 py-1 rounded">
              {gpu?.name ?? 'ВИДЕОКАРТА НЕ ВЫБРАНА'}
            </span>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                  <th className="p-3 w-1/3">Сценарий / Приложение</th>
                  <th className="p-3">Результат</th>
                  <th className="p-3 text-right">Статус</th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {scenarios.filter(s => s.category === 'GPU').map((s, idx, arr) => {
                   const score = getScore(gpuBenches, s.name);
                   const isFast = score !== '—' && (s.unit === 'FPS' ? parseFloat(score) > 60 : parseFloat(score) < 15);
                   const status = isFast ? 'Быстро' : 'Оптимально';
                   const statusColor = isFast ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700';
                   const icon = isFast ? 'bolt' : 'check_circle';
                   
                   return (
                    <tr key={s.id} className={`${idx !== arr.length - 1 ? 'border-b border-slate-200' : ''} hover:bg-slate-50 transition-colors`}>
                      <td className="p-3 text-on-surface">{s.name}</td>
                      <td className="p-3 font-mono text-blue-700 font-bold">{score} {score !== '—' ? (s.unit || getUnit(gpuBenches, s.name)) : ''}</td>
                      <td className="p-3 text-right">
                        {score !== '—' && (
                          <span className={`inline-flex items-center gap-1 ${statusColor} px-2 py-0.5 rounded text-xs font-medium`}>
                            <span className="material-symbols-outlined text-[14px]">{s.icon || icon}</span>
                            {status}
                          </span>
                        )}
                      </td>
                    </tr>
                   );
                })}
              </tbody>
            </table>
          </div>
        </section>
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

  // screen: 'build' | 'picker' | 'benchmarks'
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

  // Validate build whenever it changes
  useEffect(() => {
    const request = {
      cpuId: build.cpu?.id, motherboardId: build.motherboard?.id, ramId: build.ram?.id,
      gpuId: build.gpu?.id, storageId: build.storage?.id, psuId: build.psu?.id
    };
    validateBuild(request).then(res => setValidation(res.data)).catch(() => {});
    
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
  
        {screen === 'build' ? (
          <BuildScreen
            categories={categories}
            build={build}
            validation={validation}
            onSelectCategory={handleSelectCategory}
          />
        ) : screen === 'picker' ? (
          <PickerScreen
            activeCategory={activeCategory}
            build={build}
            onSelect={handleSelectComponent}
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
