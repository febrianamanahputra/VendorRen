import React, { useState } from 'react';
import { Send, User, Wallet, MapPin, Building2, Phone, Plus, Trash2, Edit2, X, Settings2, ListPlus, Tags } from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  type: string;
  salary: string;
  location: string;
}

export default function App() {
  const [locations, setLocations] = useState<string[]>(['Jakarta Selatan', 'Jakarta Pusat', 'Bandung']);
  const [vendorNames, setVendorNames] = useState<string[]>(['PT. Sumber Makmur', 'CV. Baja Indo', 'Toko Listrik Jaya']);
  const [vendorTypes, setVendorTypes] = useState<string[]>(['Listrik', 'Besi', 'Semen', 'Pasir']);
  
  const [vendors, setVendors] = useState<Vendor[]>([]);
  
  const [formData, setFormData] = useState({
    vendorName: vendorNames[0] || '',
    vendorType: vendorTypes[0] || '',
    salary: '',
    location: locations[0] || '',
  });

  const [targetPhone, setTargetPhone] = useState('');

  // Manager Modal State
  type ManagerType = 'location' | 'name' | 'type' | null;
  const [activeManager, setActiveManager] = useState<ManagerType>(null);
  const [newItem, setNewItem] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editItemName, setEditItemName] = useState('');

  const handleVendorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const formattedValue = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    setFormData((prev) => ({ ...prev, salary: formattedValue }));
  };

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendorName || !formData.vendorType || !formData.salary || !formData.location) return;

    setVendors(prev => [...prev, {
      id: crypto.randomUUID(),
      name: formData.vendorName,
      type: formData.vendorType,
      salary: formData.salary,
      location: formData.location
    }]);

    // Reset form except location
    setFormData(prev => ({ 
      ...prev, 
      vendorName: vendorNames[0] || '', 
      vendorType: vendorTypes[0] || '', 
      salary: '' 
    }));
  };

  const removeVendor = (id: string) => {
    setVendors(prev => prev.filter(v => v.id !== id));
  };

  // --- Unified Manager Handlers ---
  const handleAddItem = (items: string[], setItems: React.Dispatch<React.SetStateAction<string[]>>, field: string) => {
    if (!newItem.trim()) return;
    if (!items.includes(newItem.trim())) {
      setItems(prev => [...prev, newItem.trim()]);
      if (!formData[field as keyof typeof formData]) {
        setFormData(prev => ({ ...prev, [field]: newItem.trim() }));
      }
    }
    setNewItem('');
  };

  const removeItem = (itemToRemove: string, items: string[], setItems: React.Dispatch<React.SetStateAction<string[]>>, field: string) => {
    const updated = items.filter(i => i !== itemToRemove);
    setItems(updated);
    if (formData[field as keyof typeof formData] === itemToRemove) {
      setFormData(prev => ({ ...prev, [field]: updated[0] || '' }));
    }
  };

  const startEditItem = (index: number, item: string) => {
    setEditingIndex(index);
    setEditItemName(item);
  };

  const saveEditItem = (index: number, oldItem: string, items: string[], setItems: React.Dispatch<React.SetStateAction<string[]>>, field: string) => {
    if (!editItemName.trim()) return;
    
    if (items.findIndex(i => i === editItemName.trim()) !== -1 && editItemName.trim() !== oldItem) {
      alert("Item sudah ada");
      return;
    }

    setItems(prev => {
      const updated = [...prev];
      updated[index] = editItemName.trim();
      return updated;
    });

    if (field === 'location') {
      setVendors(prev => prev.map(v => v.location === oldItem ? { ...v, location: editItemName.trim() } : v));
    } else if (field === 'vendorName') {
      setVendors(prev => prev.map(v => v.name === oldItem ? { ...v, name: editItemName.trim() } : v));
    } else if (field === 'vendorType') {
      setVendors(prev => prev.map(v => v.type === oldItem ? { ...v, type: editItemName.trim() } : v));
    }

    if (formData[field as keyof typeof formData] === oldItem) {
      setFormData(prev => ({ ...prev, [field]: editItemName.trim() }));
    }

    setEditingIndex(null);
    setEditItemName('');
  };

  const managerProps = (() => {
    switch (activeManager) {
      case 'location': return { title: 'Kelola Lokasi', items: locations, setItems: setLocations, field: 'location' };
      case 'name': return { title: 'Kelola Nama Vendor', items: vendorNames, setItems: setVendorNames, field: 'vendorName' };
      case 'type': return { title: 'Kelola Jenis Vendor', items: vendorTypes, setItems: setVendorTypes, field: 'vendorType' };
      default: return null;
    }
  })();

  // --- Send WhatsApp ---
  const handleSendWA = () => {
    if (vendors.length === 0) {
      alert("Tambahkan minimal 1 vendor terlebih dahulu");
      return;
    }

    // Group vendors by location
    const groupedVendors: Record<string, Vendor[]> = {};
    vendors.forEach(v => {
      if (!groupedVendors[v.location]) groupedVendors[v.location] = [];
      groupedVendors[v.location].push(v);
    });

    // Build message
    let message = `*UPAH VENDOR* 🏢\n\n`;
    
    Object.keys(groupedVendors).sort().forEach(loc => {
      message += `📍 *Lokasi: ${loc}*\n`;
      groupedVendors[loc].forEach((v, index) => {
        message += `  ${index + 1}. *${v.name}* [${v.type}] - Rp ${v.salary}\n`;
      });
      message += `\n`; // spacing between locations
    });

    const encodedMessage = encodeURIComponent(message.trim());
    
    let phone = targetPhone.replace(/\D/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }

    let waUrl = '';
    if (phone) {
      waUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    } else {
      waUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
    }

    window.open(waUrl, '_blank');
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center py-10 px-4 font-sans text-slate-900 overflow-hidden">
      {/* YouTube Video Background (5 seconds loop) */}
      <div className="fixed inset-0 z-0 bg-slate-900">
        <iframe
          className="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-60"
          src="https://www.youtube.com/embed/lVy1WkkoMpg?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=lVy1WkkoMpg&end=5"
          allow="autoplay; encrypted-media"
          title="Background Video"
        />
        <div className="absolute inset-0 bg-slate-900/50"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg bg-white/40 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/30">
        
        {/* Header */}
        <div className="bg-emerald-600/80 p-6 text-white text-center relative backdrop-blur-md">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Upah Vendor</h1>
          <p className="text-emerald-100 text-sm mt-1">Input data per lokasi & kirim langsung via WA</p>
        </div>

        {/* List of Added Vendors */}
        {vendors.length > 0 && (
          <div className="bg-emerald-50/40 border-b border-white/30 p-4 backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-emerald-900 mb-3 flex items-center gap-2">
              <ListPlus className="w-4 h-4" /> Daftar Vendor ({vendors.length})
            </h2>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {vendors.map(v => (
                <div key={v.id} className="flex items-center justify-between bg-white/60 backdrop-blur-sm border border-white/50 p-3 rounded-lg shadow-sm">
                  <div>
                    <p className="font-semibold text-sm text-slate-800">
                      {v.name} <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full ml-1">{v.type}</span>
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Wallet className="w-3 h-3"/> {v.salary}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {v.location}</span>
                    </div>
                  </div>
                  <button onClick={() => removeVendor(v.id)} className="text-red-400 hover:text-red-500 p-1 bg-red-50 rounded-md transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <div className="p-6">
          <form onSubmit={handleAddVendor} className="space-y-4">
            
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-medium text-slate-700">
                    Nama Vendor
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setActiveManager('name')}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                  >
                    <Settings2 className="w-3 h-3" /> Kelola
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <select
                    name="vendorName"
                    required
                    value={formData.vendorName}
                    onChange={handleVendorChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-white/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white/50 focus:bg-white/80 appearance-none backdrop-blur-sm shadow-sm"
                  >
                    {vendorNames.length === 0 && <option value="" disabled>Belum ada nama vendor</option>}
                    {vendorNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-medium text-slate-700">
                    Jenis Vendor
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setActiveManager('type')}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                  >
                    <Settings2 className="w-3 h-3" /> Kelola
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tags className="h-5 w-5 text-slate-400" />
                  </div>
                  <select
                    name="vendorType"
                    required
                    value={formData.vendorType}
                    onChange={handleVendorChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-white/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white/50 focus:bg-white/80 appearance-none backdrop-blur-sm shadow-sm"
                  >
                    {vendorTypes.length === 0 && <option value="" disabled>Belum ada jenis</option>}
                    {vendorTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Gaji / Nilai Kontrak
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Wallet className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="salary"
                  required
                  value={formData.salary}
                  onChange={handleSalaryChange}
                  placeholder="Contoh: 500.000"
                  className="block w-full pl-10 pr-3 py-2.5 border border-white/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white/50 focus:bg-white/80 backdrop-blur-sm shadow-sm placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-medium text-slate-700">
                  Lokasi
                </label>
                <button 
                  type="button" 
                  onClick={() => setActiveManager('location')}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                >
                  <Settings2 className="w-3 h-3" /> Kelola Lokasi
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-slate-400" />
                </div>
                <select
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleVendorChange}
                  className="block w-full pl-10 pr-3 py-2.5 border border-white/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white/50 focus:bg-white/80 appearance-none backdrop-blur-sm shadow-sm"
                >
                  {locations.length === 0 && <option value="" disabled>Belum ada lokasi</option>}
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-emerald-100/70 hover:bg-emerald-200/80 text-emerald-900 font-semibold py-2.5 px-4 rounded-xl transition-colors flex justify-center items-center gap-2 backdrop-blur-sm"
            >
              <Plus className="w-5 h-5" />
              Tambah Vendor ke Daftar
            </button>
          </form>

          <div className="my-6 border-t border-white/40"></div>

          {/* Send Section */}
          <div>
             <label className="block text-sm font-medium text-slate-800 mb-1">
                Nomor WA Tujuan <span className="text-slate-600 font-normal">(Opsional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="tel"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="block w-full pl-10 pr-3 py-2.5 border border-white/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white/50 focus:bg-white/80 backdrop-blur-sm shadow-sm placeholder:text-slate-500"
                />
              </div>
              <button
                onClick={handleSendWA}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-emerald-200/50 transition-all flex justify-center items-center gap-2"
              >
                <Send className="w-5 h-5" />
                Kirim Laporan ke WhatsApp
              </button>
          </div>
        </div>
      </div>

      {/* Dynamic Manager Modal */}
      {activeManager && managerProps && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-emerald-600" /> {managerProps.title}
              </h3>
              <button 
                onClick={() => { setActiveManager(null); setNewItem(''); setEditingIndex(null); }} 
                className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 bg-slate-50 flex gap-2">
              <input 
                type="text" 
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Tambah item baru..."
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem(managerProps.items, managerProps.setItems, managerProps.field)}
              />
              <button 
                onClick={() => handleAddItem(managerProps.items, managerProps.setItems, managerProps.field)} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto p-4 space-y-2">
              {managerProps.items.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-4">Belum ada data tersimpan.</p>
              ) : (
                managerProps.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-lg shadow-sm">
                    {editingIndex === index ? (
                      <input 
                        type="text" 
                        value={editItemName}
                        onChange={(e) => setEditItemName(e.target.value)}
                        className="flex-1 px-2 py-1 border border-emerald-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm mr-2"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && saveEditItem(index, item, managerProps.items, managerProps.setItems, managerProps.field)}
                      />
                    ) : (
                      <span className="text-sm font-medium text-slate-700 truncate mr-2">{item}</span>
                    )}
                    
                    <div className="flex gap-1">
                      {editingIndex === index ? (
                        <>
                          <button onClick={() => saveEditItem(index, item, managerProps.items, managerProps.setItems, managerProps.field)} className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded text-xs font-semibold">
                            Simpan
                          </button>
                          <button onClick={() => setEditingIndex(null)} className="text-slate-500 hover:bg-slate-100 p-1.5 rounded text-xs">
                            Batal
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEditItem(index, item)} className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 p-1.5 rounded transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => removeItem(item, managerProps.items, managerProps.setItems, managerProps.field)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}