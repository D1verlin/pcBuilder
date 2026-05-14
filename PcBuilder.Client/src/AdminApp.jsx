import React, { useState, useEffect } from 'react';
import { 
  loginAdmin, 
  adminGetComponents, adminCreateComponent, adminUpdateComponent, adminDeleteComponent,
  adminGetCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory,
  adminGetBenchmarks, adminCreateBenchmark, adminUpdateBenchmark, adminDeleteBenchmark,
  adminGetScenarios, adminCreateScenario, adminUpdateScenario, adminDeleteScenario,
  adminGetBuilds, adminDeleteBuild
} from './api';

// ─── LOGIN SCREEN ────────────────────────────────────────────────────────────
const AdminLogin = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await loginAdmin({ email, password });
      localStorage.setItem('adminToken', res.data.token);
      onLogin(res.data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-8 w-full max-w-sm shadow-sm">
        <h1 className="text-2xl font-semibold text-on-surface mb-2">Admin Panel</h1>
        <p className="text-sm text-on-surface-variant mb-6">Enter your credentials to continue</p>
        
        {error && (
          <div className="bg-error-container text-on-error-container text-sm p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Email</label>
            <input 
              type="email" 
              value={email} onChange={e => setEmail(e.target.value)}
              className="px-3 py-2 border border-outline-variant rounded bg-surface text-on-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Password</label>
            <input 
              type="password" 
              value={password} onChange={e => setPassword(e.target.value)}
              className="px-3 py-2 border border-outline-variant rounded bg-surface text-on-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="mt-2 bg-primary text-on-primary py-2 rounded text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── UTILS & COMPONENTS ──────────────────────────────────────────────────────

const SpecsPreview = ({ json }) => {
  try {
    const specs = JSON.parse(json || '{}');
    const entries = Object.entries(specs);
    if (entries.length === 0) return <span className="text-on-surface-variant/40 italic text-[10px]">No specs</span>;
    return (
      <div className="flex flex-wrap gap-1 max-w-[200px]">
        {entries.slice(0, 3).map(([k, v]) => (
          <span key={k} className="px-1.5 py-0.5 bg-primary-container text-on-primary-container text-[10px] rounded leading-none whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
            {k}: {v}
          </span>
        ))}
        {entries.length > 3 && <span className="text-[10px] text-on-surface-variant font-bold">+{entries.length - 3}</span>}
      </div>
    );
  } catch { return null; }
};

const SpecsEditor = ({ value, onChange }) => {
  const specs = React.useMemo(() => {
    try { return JSON.parse(value || '{}'); } catch { return {}; }
  }, [value]);

  const [newKey, setNewKey] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const updateSpec = (key, newVal) => {
    const updated = { ...specs, [key]: newVal };
    onChange(JSON.stringify(updated));
  };

  const removeSpec = (key) => {
    const { [key]: _, ...rest } = specs;
    onChange(JSON.stringify(rest));
  };

  const addSpec = () => {
    if (newKey && !specs[newKey]) {
      const updated = { ...specs, [newKey]: '' };
      onChange(JSON.stringify(updated));
      setNewKey('');
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-surface-container-low rounded border border-outline-variant">
      <div className="flex justify-between items-center mb-1">
        <label className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest">Specifications</label>
        {!isAdding ? (
          <button type="button" onClick={() => setIsAdding(true)} className="text-[10px] bg-primary text-on-primary px-2 py-0.5 rounded font-bold uppercase">+ Add</button>
        ) : (
          <div className="flex gap-1">
             <input 
               type="text" 
               placeholder="Key..." 
               value={newKey} 
               onChange={e => setNewKey(e.target.value)}
               className="text-[10px] border border-outline-variant rounded px-1 w-20 outline-none"
               onKeyDown={e => e.key === 'Enter' && addSpec()}
             />
             <button type="button" onClick={addSpec} className="text-[10px] bg-primary text-on-primary px-1 rounded font-bold">OK</button>
             <button type="button" onClick={() => { setIsAdding(false); setNewKey(''); }} className="text-[10px] bg-error/10 text-error px-1 rounded font-bold">X</button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
        {Object.entries(specs).length === 0 && !isAdding && (
          <div className="text-[11px] text-on-surface-variant/60 text-center py-4 border border-dashed border-outline-variant rounded">No custom specs defined</div>
        )}
        {Object.entries(specs).map(([k, v]) => (
          <div key={k} className="flex gap-2 items-center bg-surface p-1.5 rounded border border-outline-variant/50">
            <span className="text-[11px] font-semibold w-24 truncate text-on-surface-variant" title={k}>{k}</span>
            <input 
              type="text" 
              value={v} 
              onChange={e => updateSpec(k, e.target.value)} 
              className="flex-1 text-xs border-b border-outline-variant bg-transparent outline-none focus:border-primary px-1"
            />
            <button type="button" onClick={() => removeSpec(k)} className="text-error/70 hover:text-error transition-colors">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── LOGIN SCREEN ────────────────────────────────────────────────────────────

// Components Tab
const AdminComponents = ({ categoryId, categoryLabel }) => {
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, catRes] = await Promise.all([
        adminGetComponents({ page, pageSize: 50, categoryId }),
        adminGetCategories()
      ]);
      const compData = compRes.data;
      setData(Array.isArray(compData) ? compData : (compData.items || []));
      setTotalCount(compData.totalCount || (Array.isArray(compData) ? compData.length : 0));
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [categoryId]);
  useEffect(() => { fetchData(); }, [page, categoryId]);

  const handleDelete = async (id) => {
    if (!confirm('Delete component?')) return;
    try {
      await adminDeleteComponent(id);
      fetchData();
    } catch (e) { alert('Error deleting'); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingItem.id) {
        await adminUpdateComponent(editingItem.id, editingItem);
      } else {
        await adminCreateComponent(editingItem);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Error saving component');
      console.error(err);
    }
  };

  const openModal = (item = { name: '', price: 0, categoryId: categoryId || '', tdp: 0, shortDescription: '', specsJson: '{}', socket: '', formFactor: '', memoryType: '', brand: '', categoryName: '' }) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-on-surface">{categoryLabel} ({totalCount})</h2>
        <button onClick={() => openModal()} className="bg-primary text-on-primary px-4 py-2 rounded text-sm font-semibold flex items-center gap-1">
          <span className="material-symbols-outlined text-[18px]">add</span> Add Component
        </button>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-[11px] font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant">
              <th className="p-3 w-16">ID</th>
              <th className="p-3">Name</th>
              { (categoryId === 1 || categoryId === 2) && <th className="p-3">Socket</th> }
              { (categoryId === 2 || categoryId === 5 || categoryId === 6) && <th className="p-3">Form Factor</th> }
              { (categoryId === 2 || categoryId === 3) && <th className="p-3">Memory Type</th> }
              { (categoryId === 1 || categoryId === 4) && <th className="p-3">TDP</th> }
              <th className="p-3">Brand</th>
              <th className="p-3">Specs</th>
              <th className="p-3 text-right">Price</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="9" className="p-4 text-center">Loading...</td></tr> : 
             data.map(item => (
              <tr key={item.id} className="border-b border-outline-variant last:border-b-0 hover:bg-surface-container-low text-sm">
                <td className="p-3 text-on-surface-variant">{item.id}</td>
                <td className="p-3 font-medium text-on-surface">{item.name}</td>
                { (categoryId === 1 || categoryId === 2) && <td className="p-3 text-on-surface-variant">{item.socket}</td> }
                { (categoryId === 2 || categoryId === 5 || categoryId === 6) && <td className="p-3 text-on-surface-variant">{item.formFactor}</td> }
                { (categoryId === 2 || categoryId === 3) && <td className="p-3 text-on-surface-variant">{item.memoryType}</td> }
                { (categoryId === 1 || categoryId === 4) && <td className="p-3 text-on-surface-variant font-mono">{item.tdp}W</td> }
                <td className="p-3 text-on-surface-variant">{item.brand}</td>
                <td className="p-3"><SpecsPreview json={item.specsJson} /></td>
                <td className="p-3 text-right font-mono">${item.price}</td>
                <td className="p-3 text-center">
                  <button onClick={() => openModal(item)} className="text-primary hover:bg-primary-fixed p-1 rounded mr-2">
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="text-error hover:bg-error-container p-1 rounded">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex gap-2">
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
        <button disabled={page * 50 >= totalCount} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-on-surface/20 flex items-center justify-center p-4 z-50">
          <div className="bg-surface-container-lowest rounded-lg border border-outline-variant w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">{editingItem.id ? 'Edit Component' : 'Add Component'}</h3>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-on-surface-variant">Name</label>
                  <input type="text" required value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="border rounded p-2 text-sm" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-on-surface-variant">Category</label>
                  <select required value={editingItem.categoryId} onChange={e => {
                      const cid = Number(e.target.value);
                      const cname = categories.find(c => c.id === cid)?.name || '';
                      
                      // Clear irrelevant fields when category changes
                      const updatedItem = {...editingItem, categoryId: cid, categoryName: cname};
                      if (cid !== 1 && cid !== 2) updatedItem.socket = '';
                      if (cid !== 2 && cid !== 5 && cid !== 6) updatedItem.formFactor = '';
                      if (cid !== 1 && cid !== 2 && cid !== 3) updatedItem.memoryType = '';
                      
                      setEditingItem(updatedItem);
                    }} className="border rounded p-2 text-sm">
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-on-surface-variant">Price</label>
                  <input type="number" step="0.01" required value={editingItem.price} onChange={e => setEditingItem({...editingItem, price: Number(e.target.value)})} className="border rounded p-2 text-sm" />
                </div>
                { (editingItem.categoryId === 1 || editingItem.categoryId === 4) && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase text-on-surface-variant">TDP (W)</label>
                    <input type="number" value={editingItem.tdp} onChange={e => setEditingItem({...editingItem, tdp: Number(e.target.value)})} className="border rounded p-2 text-sm" />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase text-on-surface-variant">Brand</label>
                  <input type="text" value={editingItem.brand} onChange={e => setEditingItem({...editingItem, brand: e.target.value})} className="border rounded p-2 text-sm" />
                </div>
                { (editingItem.categoryId === 1 || editingItem.categoryId === 2) && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase text-on-surface-variant">Socket</label>
                    <input type="text" value={editingItem.socket} onChange={e => setEditingItem({...editingItem, socket: e.target.value})} className="border rounded p-2 text-sm" />
                  </div>
                )}
                { (editingItem.categoryId === 2 || editingItem.categoryId === 5 || editingItem.categoryId === 6) && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase text-on-surface-variant">Form Factor</label>
                    <input type="text" value={editingItem.formFactor} onChange={e => setEditingItem({...editingItem, formFactor: e.target.value})} className="border rounded p-2 text-sm" />
                  </div>
                )}
                { (editingItem.categoryId === 2 || editingItem.categoryId === 3) && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase text-on-surface-variant">Memory Type</label>
                    <input type="text" value={editingItem.memoryType} onChange={e => setEditingItem({...editingItem, memoryType: e.target.value})} className="border rounded p-2 text-sm" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase text-on-surface-variant">Short Description</label>
                <input type="text" value={editingItem.shortDescription} onChange={e => setEditingItem({...editingItem, shortDescription: e.target.value})} className="border rounded p-2 text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <SpecsEditor value={editingItem.specsJson} onChange={val => setEditingItem({...editingItem, specsJson: val})} />
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded text-sm text-on-surface-variant">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-on-primary rounded text-sm font-semibold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Categories Tab
const AdminCategories = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminGetCategories();
      setData(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete category?')) return;
    try { await adminDeleteCategory(id); fetchData(); } catch (e) { alert('Error deleting'); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingItem.id) { await adminUpdateCategory(editingItem.id, editingItem); }
      else { await adminCreateCategory(editingItem); }
      setModalOpen(false); fetchData();
    } catch (err) { alert('Error saving'); }
  };

  const openModal = (item = { name: '', slug: '' }) => { setEditingItem(item); setModalOpen(true); };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-on-surface">Categories</h2>
        <button onClick={() => openModal()} className="bg-primary text-on-primary px-4 py-2 rounded text-sm font-semibold">Add Category</button>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-[11px] font-bold uppercase text-on-surface-variant border-b border-outline-variant">
              <th className="p-3 w-16">ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Slug</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="4" className="p-4 text-center">Loading...</td></tr> : 
             data.map(item => (
              <tr key={item.id} className="border-b border-outline-variant text-sm hover:bg-surface-container-low">
                <td className="p-3 text-on-surface-variant">{item.id}</td>
                <td className="p-3 font-medium text-on-surface">{item.name}</td>
                <td className="p-3 text-on-surface-variant font-mono">{item.slug}</td>
                <td className="p-3 text-center">
                  <button onClick={() => openModal(item)} className="text-primary hover:bg-primary-fixed p-1 rounded mr-2"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                  <button onClick={() => handleDelete(item.id)} className="text-error hover:bg-error-container p-1 rounded"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-on-surface/20 flex items-center justify-center p-4 z-50">
          <div className="bg-surface-container-lowest rounded-lg border border-outline-variant w-full max-w-sm p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">{editingItem.id ? 'Edit Category' : 'Add Category'}</h3>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase text-on-surface-variant">Name</label>
                <input type="text" required value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="border rounded p-2 text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase text-on-surface-variant">Slug</label>
                <input type="text" required value={editingItem.slug} onChange={e => setEditingItem({...editingItem, slug: e.target.value})} className="border rounded p-2 text-sm" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded text-sm text-on-surface-variant">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-on-primary rounded text-sm font-semibold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Benchmarks Tab
const AdminBenchmarks = () => {
  const [data, setData] = useState([]);
  const [components, setComponents] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [benchRes, compRes, scenRes] = await Promise.all([
        adminGetBenchmarks(),
        adminGetComponents({ pageSize: 1000 }),
        adminGetScenarios()
      ]);
      const bData = benchRes.data;
      const cData = compRes.data;
      setData(Array.isArray(bData) ? bData : (bData.value || []));
      setComponents(Array.isArray(cData) ? cData : (cData.items || []));
      setScenarios(scenRes.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete benchmark?')) return;
    try { await adminDeleteBenchmark(id); fetchData(); } catch (e) { alert('Error deleting'); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingItem.id) { await adminUpdateBenchmark(editingItem.id, editingItem); }
      else { await adminCreateBenchmark(editingItem); }
      setModalOpen(false); fetchData();
    } catch (err) { alert('Error saving'); }
  };

  const openModal = (item = { pcComponentId: '', type: '', score: 0, unit: '' }) => { setEditingItem(item); setModalOpen(true); };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-on-surface">Benchmarks</h2>
        <button onClick={() => openModal()} className="bg-primary text-on-primary px-4 py-2 rounded text-sm font-semibold">Add Benchmark</button>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-[11px] font-bold uppercase text-on-surface-variant border-b border-outline-variant">
              <th className="p-3">Component</th>
              <th className="p-3">Scenario / Type</th>
              <th className="p-3 text-right">Score</th>
              <th className="p-3">Unit</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr> : 
             data.map(item => (
              <tr key={item.id} className="border-b border-outline-variant text-sm hover:bg-surface-container-low">
                <td className="p-3">
                  <div className="font-medium text-on-surface">{item.pcComponent?.name || `ID: ${item.pcComponentId}`}</div>
                  <div className="text-[10px] text-on-surface-variant uppercase font-bold">{item.pcComponent?.categoryName}</div>
                </td>
                <td className="p-3 text-on-surface-variant font-medium">{item.type}</td>
                <td className="p-3 text-right font-mono font-bold text-primary">{item.score}</td>
                <td className="p-3 text-on-surface-variant">{item.unit}</td>
                <td className="p-3 text-center">
                  <button onClick={() => openModal(item)} className="text-primary hover:bg-primary-fixed p-1 rounded mr-2"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                  <button onClick={() => handleDelete(item.id)} className="text-error hover:bg-error-container p-1 rounded"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-on-surface/20 flex items-center justify-center p-4 z-50">
          <div className="bg-surface-container-lowest rounded-lg border border-outline-variant w-full max-w-sm p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">{editingItem.id ? 'Edit Benchmark' : 'Add Benchmark'}</h3>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase text-on-surface-variant">Component</label>
                <select required value={editingItem.pcComponentId} onChange={e => setEditingItem({...editingItem, pcComponentId: Number(e.target.value)})} className="border rounded p-2 text-sm">
                  <option value="">Select Component</option>
                  {components
                    .filter(c => c && c.name)
                    .sort((a,b) => a.name.localeCompare(b.name))
                    .map(c => <option key={c.id} value={c.id}>{c.name} ({c.categoryName || 'No Category'})</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase text-on-surface-variant">Scenario / Type</label>
                <div className="flex flex-col gap-2">
                  <select 
                    className="border rounded p-2 text-sm bg-surface-container-low"
                    onChange={e => {
                      const s = scenarios.find(sc => sc.name === e.target.value);
                      if (s) setEditingItem({...editingItem, type: s.name, unit: s.unit});
                    }}
                  >
                    <option value="">-- Quick Select Scenario --</option>
                    {scenarios.map(s => <option key={s.id} value={s.name}>{s.name} ({s.category})</option>)}
                  </select>
                  <input type="text" placeholder="Or type custom type..." required value={editingItem.type} onChange={e => setEditingItem({...editingItem, type: e.target.value})} className="border rounded p-2 text-sm" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase text-on-surface-variant">Score</label>
                <input type="text" required value={editingItem.score} onChange={e => setEditingItem({...editingItem, score: e.target.value})} className="border rounded p-2 text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase text-on-surface-variant">Unit</label>
                <input type="text" placeholder="e.g. pts, FPS, s" required value={editingItem.unit} onChange={e => setEditingItem({...editingItem, unit: e.target.value})} className="border rounded p-2 text-sm" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded text-sm text-on-surface-variant">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-on-primary rounded text-sm font-semibold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Scenarios Tab
const AdminScenarios = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminGetScenarios();
      const sData = res.data;
      setData(Array.isArray(sData) ? sData : (sData.value || sData.items || []));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete scenario?')) return;
    try { await adminDeleteScenario(id); fetchData(); } catch (e) { alert('Error deleting'); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingItem.id) { await adminUpdateScenario(editingItem.id, editingItem); }
      else { await adminCreateScenario(editingItem); }
      setModalOpen(false); fetchData();
    } catch (err) { alert('Error saving'); }
  };

  const openModal = (item = { name: '', category: 'Gaming', unit: '', icon: 'speed', description: '' }) => { setEditingItem(item); setModalOpen(true); };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-on-surface">Benchmark Scenarios</h2>
        <button onClick={() => openModal()} className="bg-primary text-on-primary px-4 py-2 rounded text-sm font-semibold">Add Scenario</button>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-[11px] font-bold uppercase text-on-surface-variant border-b border-outline-variant">
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Unit</th>
              <th className="p-3">Icon</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr> : 
             data.map(item => (
              <tr key={item.id} className="border-b border-outline-variant text-sm hover:bg-surface-container-low">
                <td className="p-3">
                  <div className="font-medium text-on-surface">{item.name}</div>
                  <div className="text-[10px] text-on-surface-variant">{item.description}</div>
                </td>
                <td className="p-3 text-on-surface-variant">{item.category}</td>
                <td className="p-3 text-on-surface-variant">{item.unit}</td>
                <td className="p-3 text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  {item.icon}
                </td>
                <td className="p-3 text-center">
                  <button onClick={() => openModal(item)} className="text-primary hover:bg-primary-fixed p-1 rounded mr-2"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                  <button onClick={() => handleDelete(item.id)} className="text-error hover:bg-error-container p-1 rounded"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-on-surface/20 flex items-center justify-center p-4 z-50">
          <div className="bg-surface-container-lowest rounded-lg border border-outline-variant w-full max-w-sm p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">{editingItem.id ? 'Edit Scenario' : 'Add Scenario'}</h3>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase text-on-surface-variant">Name</label>
                <input type="text" required value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="border rounded p-2 text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase text-on-surface-variant">Category</label>
                <select value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value})} className="border rounded p-2 text-sm">
                  <option value="Gaming">Gaming</option>
                  <option value="Synthetic">Synthetic</option>
                  <option value="Production">Production</option>
                  <option value="Memory">Memory</option>
                  <option value="Storage">Storage</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase text-on-surface-variant">Unit</label>
                <input type="text" value={editingItem.unit} onChange={e => setEditingItem({...editingItem, unit: e.target.value})} className="border rounded p-2 text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase text-on-surface-variant flex justify-between items-center">
                  Icon (Material)
                  <a href="https://fonts.google.com/icons" target="_blank" rel="noreferrer" className="text-[10px] text-primary lowercase hover:underline">gallery</a>
                </label>
                <div className="flex flex-wrap gap-2 p-2 bg-surface border rounded max-h-32 overflow-y-auto">
                  {['analytics', 'speed', 'view_in_ar', 'sports_esports', 'movie_edit', 'download', 'upload', 'width', 'timer', 'memory', 'dns', 'bolt', 'check_circle', 'settings', 'computer', 'videogame_asset', 'render', 'movie', 'graphic_eq'].map(icon => (
                    <button 
                      key={icon}
                      type="button" 
                      onClick={() => setEditingItem({...editingItem, icon})}
                      className={`p-1.5 rounded transition-colors ${editingItem.icon === icon ? 'bg-primary text-on-primary' : 'hover:bg-primary-fixed text-on-surface-variant'}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{icon}</span>
                    </button>
                  ))}
                  <input 
                    type="text" 
                    placeholder="Other..." 
                    value={!['analytics', 'speed', 'view_in_ar', 'sports_esports', 'movie_edit', 'download', 'upload', 'width', 'timer', 'memory', 'dns', 'bolt', 'check_circle', 'settings', 'computer', 'videogame_asset', 'render', 'movie', 'graphic_eq'].includes(editingItem.icon) ? editingItem.icon : ''} 
                    onChange={e => setEditingItem({...editingItem, icon: e.target.value})} 
                    className="flex-1 min-w-[60px] text-xs border-b border-outline-variant outline-none focus:border-primary px-1"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase text-on-surface-variant">Description</label>
                <textarea value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value})} className="border rounded p-2 text-sm h-20" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded text-sm text-on-surface-variant">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-on-primary rounded text-sm font-semibold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Builds Tab
const AdminBuilds = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminGetBuilds({ page, pageSize: 20 });
      setData(res.data.items || res.data);
      setTotalCount(res.data.totalCount || res.data.length);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page]);

  const handleDelete = async (id) => {
    if (!confirm('Delete build?')) return;
    try { await adminDeleteBuild(id); fetchData(); } catch (e) { alert('Error deleting'); }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-on-surface mb-6">Builds ({totalCount})</h2>
      <div className="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-[11px] font-bold uppercase text-on-surface-variant border-b border-outline-variant">
              <th className="p-3">ID / Name</th>
              <th className="p-3">CPU</th>
              <th className="p-3">GPU</th>
              <th className="p-3 text-right">Total Price</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr> : 
             data.map(item => (
              <tr key={item.id} className="border-b border-outline-variant text-sm hover:bg-surface-container-low">
                <td className="p-3">
                  <div className="font-medium text-on-surface">{item.name || 'Unnamed Build'}</div>
                  <div className="text-xs text-on-surface-variant font-mono">{item.id.substring(0,8)}...</div>
                </td>
                <td className="p-3 text-on-surface-variant">{item.cpu?.name || '—'}</td>
                <td className="p-3 text-on-surface-variant">{item.gpu?.name || '—'}</td>
                <td className="p-3 text-right font-mono">${item.totalPrice}</td>
                <td className="p-3 text-center">
                  <button onClick={() => handleDelete(item.id)} className="text-error hover:bg-error-container p-1 rounded"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex gap-2">
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
        <button disabled={page * 20 >= totalCount} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
      </div>
    </div>
  );
};


// ─── MAIN ADMIN APP ──────────────────────────────────────────────────────────
const COMPONENT_CATEGORIES = [
  { id: 'cat-1', categoryId: 1, label: 'CPUs', icon: 'memory' },
  { id: 'cat-2', categoryId: 2, label: 'Motherboards', icon: 'developer_board' },
  { id: 'cat-3', categoryId: 3, label: 'RAM', icon: 'analytics' },
  { id: 'cat-4', categoryId: 4, label: 'GPUs', icon: 'video_settings' },
  { id: 'cat-5', categoryId: 5, label: 'Storage', icon: 'storage' },
  { id: 'cat-6', categoryId: 6, label: 'PSUs', icon: 'bolt' },
];

const AdminApp = () => {
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [activeTab, setActiveTab] = useState('cat-1');

  if (!token) {
    return <AdminLogin onLogin={setToken} />;
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
  };

  const activeCat = COMPONENT_CATEGORIES.find(c => c.id === activeTab);

  return (
    <div className="min-h-screen bg-surface flex text-on-surface" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Sidebar */}
      <div className="w-64 bg-surface-container-lowest border-r border-outline-variant flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-outline-variant">
          <h1 className="text-lg font-bold text-slate-900 tracking-tighter">PC-SPEC PRO</h1>
          <div className="text-xs text-on-surface-variant font-medium mt-1 uppercase tracking-widest">Admin Panel</div>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
          <div className="text-[10px] text-on-surface-variant font-bold mt-2 mb-1 px-4 uppercase tracking-widest">Components</div>
          {COMPONENT_CATEGORIES.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
          
          <div className="text-[10px] text-on-surface-variant font-bold mt-4 mb-1 px-4 uppercase tracking-widest">System</div>
          {[
            { id: 'categories', label: 'Categories', icon: 'category' },
            { id: 'scenarios', label: 'Scenarios', icon: 'list_alt' },
            { id: 'benchmarks', label: 'Benchmarks', icon: 'speed' },
            { id: 'builds', label: 'User Builds', icon: 'computer' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-outline-variant">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-error hover:bg-error-container w-full transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 min-h-screen bg-surface">
        {activeCat && <AdminComponents categoryId={activeCat.categoryId} categoryLabel={activeCat.label} />}
        {activeTab === 'categories' && <AdminCategories />}
        {activeTab === 'scenarios' && <AdminScenarios />}
        {activeTab === 'benchmarks' && <AdminBenchmarks />}
        {activeTab === 'builds' && <AdminBuilds />}
      </div>
    </div>
  );
};

export default AdminApp;
