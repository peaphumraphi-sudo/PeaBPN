
import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem } from '../types';
import { Search, QrCode, Plus, Minus, Edit2, Trash2, Filter, AlertCircle, X, Camera } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface MainWarehouseProps {
  inventory: InventoryItem[];
  onUpdateInventory: (items: InventoryItem[]) => void;
  userRole?: 'ADMIN' | 'OPERATOR';
}

const MainWarehouse: React.FC<MainWarehouseProps> = ({ inventory, onUpdateInventory, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isScanMode, setIsScanMode] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const adjustQuantity = (id: string, delta: number) => {
    onUpdateInventory(inventory.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }));
  };

  const handleUpdateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      const existing = inventory.find(i => i.id === editingItem.id);
      if (existing) {
         onUpdateInventory(inventory.map(i => i.id === editingItem.id ? editingItem : i));
      } else {
         onUpdateInventory([...inventory, editingItem]);
      }
      setEditingItem(null);
    }
  };

  // Real QR Scan Handling
  useEffect(() => {
    if (isScanMode) {
      const startScanner = async () => {
        try {
          const html5QrCode = new Html5Qrcode("reader");
          scannerRef.current = html5QrCode;
          
          await html5QrCode.start(
            { facingMode: "environment" },
            { 
              fps: 10, 
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0
            },
            (decodedText) => {
              handleScanSuccess(decodedText);
            },
            (errorMessage) => {
              // Silent errors during scanning are normal
            }
          );
          setScanError(null);
        } catch (err) {
          console.error("Unable to start scanner", err);
          setScanError("ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบสิทธิ์การใช้งาน");
        }
      };

      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isScanMode]);

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    // Try to find the item in inventory
    const foundItem = inventory.find(item => item.id === decodedText || item.qrCode === decodedText);
    
    if (foundItem) {
      if (userRole === 'ADMIN') {
        stopScanner().then(() => {
          setIsScanMode(false);
          setEditingItem(foundItem);
        });
      } else {
        // For operators, maybe just show information or do nothing
        // For now, let's just close scanner and show alert if they can't edit
        stopScanner().then(() => {
          setIsScanMode(false);
          alert(`พบพัสดุ: ${foundItem.name} (คงเหลือ: ${foundItem.quantity} ${foundItem.unit})`);
        });
      }
    } else {
      // If not found, maybe it's a new item ID
      if (userRole === 'ADMIN') {
        if (confirm(`ไม่พบพัสดุรหัส "${decodedText}" ในระบบ ต้องการเพิ่มพัสดุใหม่ด้วยรหัสนี้หรือไม่?`)) {
          stopScanner().then(() => {
            setIsScanMode(false);
            setEditingItem({ 
              id: decodedText, 
              name: '', 
              category: '', 
              quantity: 0, 
              unit: '', 
              minThreshold: 5 
            });
          });
        }
      } else {
        stopScanner().then(() => {
          setIsScanMode(false);
          alert(`ไม่พบพัสดุรหัส "${decodedText}" ในระบบ`);
        });
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header & Controls */}
      <div className="p-6 border-b border-slate-50 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="ค้นหาตามชื่อ หรือ ID พัสดุ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsScanMode(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition shadow-sm"
            >
              <QrCode className="w-5 h-5" />
              <span>แสกน QR</span>
            </button>
            {userRole === 'ADMIN' && (
              <button 
                onClick={() => setEditingItem({ id: `ITM${Date.now()}`, name: '', category: '', quantity: 0, unit: '', minThreshold: 5 })}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition shadow-sm"
              >
                <Plus className="w-5 h-5" />
                <span>เพิ่มของใหม่</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table (Desktop) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">รหัส/ชื่อพัสดุ</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">หมวดหมู่</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">คงเหลือ</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">หน่วย</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">จัดการจำนวน</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredInventory.map(item => (
              <tr key={item.id} className={`hover:bg-slate-50/50 transition ${item.quantity <= item.minThreshold ? 'bg-red-50/30' : ''}`}>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-slate-800 flex items-center gap-2">
                      {item.name}
                      {/* Fixed: Wrapped AlertCircle in a span to provide the title attribute since the icon component doesn't support it directly */}
                      {item.quantity <= item.minThreshold && (
                        <span title="ของเหลือน้อย">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">{item.id}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[11px] rounded-full font-medium">
                    {item.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`font-bold ${item.quantity <= item.minThreshold ? 'text-red-600' : 'text-slate-700'}`}>
                    {item.quantity}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500">{item.unit}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => adjustQuantity(item.id, -1)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-white transition text-slate-500"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    {userRole === 'ADMIN' && (
                      <button 
                        onClick={() => adjustQuantity(item.id, 1)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-white transition text-slate-500"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  {userRole === 'ADMIN' && (
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setEditingItem(item)}
                        className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if(confirm('ยืนยันการลบรายการนี้?')) {
                            onUpdateInventory(inventory.filter(i => i.id !== item.id));
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredInventory.length === 0 && (
          <div className="py-20 text-center text-slate-400">
            <Filter className="w-12 h-12 mx-auto opacity-20 mb-4" />
            <p>ไม่พบรายการที่ค้นหา</p>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-slate-50">
        {filteredInventory.map(item => (
          <div key={item.id} className={`p-5 space-y-4 transition-all active:bg-slate-50 ${item.quantity <= item.minThreshold ? 'bg-red-50/40' : ''}`}>
            <div className="flex justify-between items-start">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] rounded-md font-black uppercase tracking-wider">
                    {item.category}
                  </span>
                  {item.quantity <= item.minThreshold && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[9px] rounded-md font-black uppercase tracking-wider flex items-center gap-1">
                      <AlertCircle className="w-2.5 h-2.5" />
                      เหลือน้อย
                    </span>
                  )}
                </div>
                <h4 className="font-black text-slate-800 text-base leading-tight">{item.name}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{item.id}</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-black leading-none ${item.quantity <= item.minThreshold ? 'text-red-600' : 'text-slate-800'}`}>
                  {item.quantity}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{item.unit}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center bg-white rounded-2xl p-1 shadow-sm border border-slate-100">
                <button 
                  onClick={() => adjustQuantity(item.id, -1)}
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 active:scale-95 transition-transform"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="w-12 text-center">
                  <span className="font-black text-slate-800 text-lg">{item.quantity}</span>
                </div>
                {userRole === 'ADMIN' && (
                  <button 
                    onClick={() => adjustQuantity(item.id, 1)}
                    className="w-11 h-11 flex items-center justify-center rounded-xl bg-purple-600 text-white active:scale-95 transition-transform"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              {userRole === 'ADMIN' && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditingItem(item)}
                    className="w-11 h-11 flex items-center justify-center bg-white text-slate-400 rounded-2xl border border-slate-100 shadow-sm active:scale-95 transition-all"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => {
                      if(confirm('ยืนยันการลบรายการนี้?')) {
                        onUpdateInventory(inventory.filter(i => i.id !== item.id));
                      }
                    }}
                    className="w-11 h-11 flex items-center justify-center bg-red-50 text-red-500 rounded-2xl border border-red-100 active:scale-95 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {filteredInventory.length === 0 && (
          <div className="py-10 text-center text-slate-400">
            <p>ไม่พบรายการที่ค้นหา</p>
          </div>
        )}
      </div>

      {/* Actual QR Scan Modal */}
      {isScanMode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-600" />
                แสกน QR Code
              </h3>
              <button onClick={() => setIsScanMode(false)} className="p-2 hover:bg-slate-100 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center gap-4">
              {scanError ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center text-sm border border-red-100">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  {scanError}
                </div>
              ) : (
                <div className="relative w-full aspect-square max-w-[300px] border-4 border-slate-100 rounded-2xl overflow-hidden bg-slate-900">
                  <div id="reader" className="w-full h-full"></div>
                  <div className="absolute inset-0 border-2 border-purple-500/30 rounded-xl pointer-events-none animate-pulse"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white/20 rounded-lg pointer-events-none"></div>
                </div>
              )}
              <p className="text-center text-slate-500 text-sm px-4">
                ถือกล้องให้ตรงกับ QR Code บนพัสดุเพื่อระบุรายการและแก้ไขจำนวน
              </p>
              <button 
                onClick={() => setIsScanMode(false)}
                className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-lg">แก้ไข/เพิ่มพัสดุ</h3>
              <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-slate-100 rounded-full transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUpdateItem} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">รหัสพัสดุ</label>
                <input 
                  type="text" 
                  value={editingItem.id} 
                  onChange={(e) => setEditingItem({...editingItem, id: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อพัสดุ</label>
                <input 
                  type="text" 
                  value={editingItem.name} 
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" 
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">หมวดหมู่</label>
                  <input 
                    type="text" 
                    value={editingItem.category} 
                    onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">หน่วยนับ</label>
                  <input 
                    type="text" 
                    value={editingItem.unit} 
                    onChange={(e) => setEditingItem({...editingItem, unit: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" 
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">จำนวนคงเหลือ</label>
                  <input 
                    type="number" 
                    value={editingItem.quantity} 
                    onChange={(e) => setEditingItem({...editingItem, quantity: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">จุดเตือนขั้นต่ำ</label>
                  <input 
                    type="number" 
                    value={editingItem.minThreshold} 
                    onChange={(e) => setEditingItem({...editingItem, minThreshold: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" 
                    required
                  />
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl shadow-lg hover:bg-purple-700 transition">
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainWarehouse;
