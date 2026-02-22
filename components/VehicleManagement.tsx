
import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem, VehicleInventory, DailyCountLog } from '../types';
import { Truck, Download, Save, UserCheck, Search, ChevronRight, FileText, X, PackagePlus, ArrowRightLeft, Minus, Plus, QrCode, Camera, AlertCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface VehicleManagementProps {
  inventory: InventoryItem[];
  vehicles: VehicleInventory[];
  onUpdateInventory: (items: InventoryItem[]) => void;
  onUpdateVehicles: (v: VehicleInventory[]) => void;
  onTransferItems: (vehicleId: string, transfers: { itemId: string, quantity: number }[]) => void;
  logs: DailyCountLog[];
  onAddLog: (log: DailyCountLog) => void;
}

const VehicleManagement: React.FC<VehicleManagementProps> = ({ 
  inventory, vehicles, onUpdateInventory, onUpdateVehicles, onTransferItems, logs, onAddLog 
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isCounting, setIsCounting] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [countData, setCountData] = useState<{itemId: string, actual: number}[]>([]);
  const [transferData, setTransferData] = useState<{itemId: string, quantity: number}[]>([]);
  const [reporter, setReporter] = useState('');
  const [receiver, setReceiver] = useState('');
  const [transferSearch, setTransferSearch] = useState('');
  const [isScanMode, setIsScanMode] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const selectedVehicle = vehicles.find(v => v.vehicleId === selectedVehicleId);

  // QR Scan Handling
  useEffect(() => {
    if (isScanMode) {
      const startScanner = async () => {
        try {
          const html5QrCode = new Html5Qrcode("vehicle-reader");
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
    const foundItem = inventory.find(item => item.id === decodedText || item.qrCode === decodedText);
    
    if (foundItem) {
      stopScanner().then(() => {
        setIsScanMode(false);
        // Add to transfer data if not exists, or just ensure it's selected
        setTransferData(prev => {
          const exists = prev.find(p => p.itemId === foundItem.id);
          if (exists) {
            return prev; // Already in list
          } else {
            return [...prev, { itemId: foundItem.id, quantity: 1 }];
          }
        });
        // Scroll to the item or highlight? For now just adding is fine.
        // We might want to set the search term to the item name to show it
        setTransferSearch(foundItem.name);
      });
    } else {
      alert(`ไม่พบพัสดุรหัส "${decodedText}" ในคลังหลัก`);
    }
  };

  const startDailyCount = () => {
    if (!selectedVehicle) return;
    setCountData(selectedVehicle.items.map(i => ({ itemId: i.itemId, actual: i.quantity })));
    setIsCounting(true);
  };

  const handleSaveCount = () => {
    if (!selectedVehicle || !reporter || !receiver) {
      alert('กรุณากรอกชื่อผู้รับ-ส่งมอบให้ครบถ้วน');
      return;
    }

    const newLog: DailyCountLog = {
      id: `LOG-${Date.now()}`,
      date: new Date().toISOString(),
      vehicleId: selectedVehicle.vehicleId,
      reporter,
      receiver,
      items: countData.map(c => ({ itemId: c.itemId, actualQuantity: c.actual }))
    };

    onAddLog(newLog);

    // Update vehicle quantity based on count
    const updatedVehicles = vehicles.map(v => {
      if (v.vehicleId === selectedVehicle.vehicleId) {
        return {
          ...v,
          items: v.items.map(item => {
            const counted = countData.find(c => c.itemId === item.itemId);
            return counted ? { ...item, quantity: counted.actual } : item;
          })
        };
      }
      return v;
    });

    onUpdateVehicles(updatedVehicles);
    setIsCounting(false);
    
    const itemsBelowMin = countData.filter(c => {
      const mainInfo = inventory.find(i => i.id === c.itemId);
      return c.actual < (mainInfo?.minThreshold || 0);
    });

    if (itemsBelowMin.length > 0) {
      alert(`บันทึกผลการตรวจนับเรียบร้อยแล้ว\n\n⚠️ พบพัสดุต่ำกว่าเกณฑ์ ${itemsBelowMin.length} รายการ กรุณาดำเนินการเบิกเติมพัสดุ`);
    } else {
      alert('บันทึกผลการตรวจนับเรียบร้อยแล้ว');
    }
  };

  const handleConfirmTransfer = () => {
    if (!selectedVehicle) return;
    const validTransfers = transferData.filter(t => t.quantity > 0);
    if (validTransfers.length === 0) {
      alert('กรุณาระบุจำนวนพัสดุที่ต้องการเบิก');
      return;
    }

    onTransferItems(selectedVehicle.vehicleId, validTransfers);
    setIsTransferring(false);
    setTransferData([]);
    alert('เบิกพัสดุเข้ารถเรียบร้อยแล้ว');
  };

  const toggleTransferItem = (itemId: string) => {
    setTransferData(prev => {
      const exists = prev.find(p => p.itemId === itemId);
      if (exists) {
        return prev.filter(p => p.itemId !== itemId);
      } else {
        return [...prev, { itemId, quantity: 1 }];
      }
    });
  };

  const updateTransferQty = (itemId: string, qty: number) => {
    const mainItem = inventory.find(i => i.id === itemId);
    const safeQty = Math.max(0, Math.min(qty, mainItem?.quantity || 0));
    setTransferData(prev => prev.map(p => p.itemId === itemId ? { ...p, quantity: safeQty } : p));
  };

  const exportLogs = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "วันที่,รหัสรถ,ผู้ส่งมอบ,ผู้รับมอบ,รายการพัสดุ,จำนวนจริง\n"
      + logs.map(l => {
          return l.items.map(i => {
            const item = inventory.find(inv => inv.id === i.itemId);
            return `${new Date(l.date).toLocaleDateString()},${l.vehicleId},${l.reporter},${l.receiver},${item?.name},${i.actualQuantity}`;
          }).join('\n');
      }).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "daily_vehicle_stock_report.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Vehicle Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map(v => (
          <button 
            key={v.vehicleId}
            onClick={() => setSelectedVehicleId(v.vehicleId)}
            className={`p-6 rounded-2xl text-left transition border-2 flex flex-col gap-3 group ${selectedVehicleId === v.vehicleId ? 'border-purple-600 bg-white shadow-lg' : 'border-transparent bg-white hover:border-slate-200'}`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-xl transition ${selectedVehicleId === v.vehicleId ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-purple-100 group-hover:text-purple-600'}`}>
                <Truck className="w-6 h-6" />
              </div>
              <ChevronRight className={`w-5 h-5 transition ${selectedVehicleId === v.vehicleId ? 'text-purple-600' : 'text-slate-300'}`} />
            </div>
            <div>
              <p className="font-bold text-lg text-slate-800">{v.plateNumber}</p>
              <p className="text-sm text-slate-500">พัสดุรวม {v.items.length} รายการ</p>
            </div>
          </button>
        ))}
      </div>

      {selectedVehicle && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-xl text-slate-800">รายการพัสดุบนรถ {selectedVehicle.plateNumber}</h3>
              <p className="text-sm text-slate-500">ข้อมูลเชื่อมโยงจากคลังพัสดุหลัก</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button 
                onClick={() => setIsTransferring(true)}
                className="px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition flex items-center gap-2"
              >
                <PackagePlus className="w-5 h-5" />
                <span>เบิกของเข้ารถ</span>
              </button>
              <button 
                onClick={startDailyCount}
                className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition flex items-center gap-2"
              >
                <UserCheck className="w-5 h-5" />
                <span>ตรวจนับประจำวัน</span>
              </button>
              <button 
                onClick={exportLogs}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                <span>รายงาน (.CSV)</span>
              </button>
            </div>
          </div>

          {/* Table (Desktop) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">พัสดุ</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">คงเหลือบนรถ</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">หน่วย</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">สถานะในคลังหลัก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {selectedVehicle.items.map(item => {
                  const mainInfo = inventory.find(i => i.id === item.itemId);
                  const isBelowMin = item.quantity < (mainInfo?.minThreshold || 0);
                  return (
                    <tr key={item.itemId} className={isBelowMin ? 'bg-red-50/30' : ''}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {isBelowMin && <AlertCircle className="w-4 h-4 text-red-500" />}
                          <div>
                            <p className="font-medium text-slate-800">{mainInfo?.name}</p>
                            <p className="text-xs text-slate-400">{item.itemId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${isBelowMin ? 'text-red-600' : 'text-slate-700'}`}>{item.quantity}</span>
                        {isBelowMin && <span className="ml-2 text-[10px] text-red-500 font-bold">(ต่ำกว่าเกณฑ์ {mainInfo?.minThreshold})</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-500">{mainInfo?.unit}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${mainInfo && mainInfo.quantity > mainInfo.minThreshold ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                          <span className="text-xs text-slate-500">คลังหลักคงเหลือ: {mainInfo?.quantity}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards (Mobile) */}
          <div className="md:hidden divide-y divide-slate-50">
            {selectedVehicle.items.map(item => {
              const mainInfo = inventory.find(i => i.id === item.itemId);
              const isBelowMin = item.quantity < (mainInfo?.minThreshold || 0);
              return (
                <div key={item.itemId} className={`p-5 space-y-3 transition-all ${isBelowMin ? 'bg-red-50/40' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] rounded-md font-black uppercase tracking-wider">
                          {mainInfo?.category || 'ทั่วไป'}
                        </span>
                        {isBelowMin && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[9px] rounded-md font-black uppercase tracking-wider flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5" />
                            ต่ำกว่าเกณฑ์
                          </span>
                        )}
                      </div>
                      <h4 className="font-black text-slate-800 text-base leading-tight">{mainInfo?.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{item.itemId}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-black leading-none ${isBelowMin ? 'text-red-600' : 'text-slate-800'}`}>
                        {item.quantity}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{mainInfo?.unit}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                      <div className={`w-2 h-2 rounded-full ${mainInfo && mainInfo.quantity > mainInfo.minThreshold ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">คลังหลัก: {mainInfo?.quantity}</span>
                    </div>
                    {isBelowMin && (
                      <p className="text-[10px] text-red-500 font-black uppercase tracking-wider">ขั้นต่ำ: {mainInfo?.minThreshold}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferring && selectedVehicle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-slate-800">เบิกพัสดุจากคลังเข้ารถ: {selectedVehicle.plateNumber}</h3>
              </div>
              <button onClick={() => setIsTransferring(false)} className="p-2 hover:bg-slate-100 rounded-full transition"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="ค้นหาพัสดุจากคลังหลัก..."
                    value={transferSearch}
                    onChange={(e) => setTransferSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-purple-500 transition"
                  />
                </div>
                <button 
                  onClick={() => setIsScanMode(true)}
                  className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition shadow-sm flex items-center justify-center aspect-square"
                  title="แสกน QR Code"
                >
                  <QrCode className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">เลือกรายการพัสดุ</p>
                <div className="grid grid-cols-1 gap-2">
                  {inventory
                    .filter(item => item.name.toLowerCase().includes(transferSearch.toLowerCase()) || item.id.toLowerCase().includes(transferSearch.toLowerCase()))
                    .map(item => {
                      const isSelected = transferData.some(t => t.itemId === item.id);
                      const selectedQty = transferData.find(t => t.itemId === item.id)?.quantity || 0;
                      
                      return (
                        <div 
                          key={item.id} 
                          className={`p-4 rounded-2xl border transition flex items-center justify-between ${isSelected ? 'border-purple-200 bg-purple-50/50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                        >
                          <div className="flex items-center gap-4">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => toggleTransferItem(item.id)}
                              className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                            />
                            <div>
                              <p className="font-semibold text-slate-800">{item.name}</p>
                              <p className="text-xs text-slate-500">ในคลังหลักคงเหลือ: {item.quantity} {item.unit}</p>
                            </div>
                          </div>
                          
                          {isSelected && (
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => updateTransferQty(item.id, selectedQty - 1)}
                                className="p-1 rounded-md bg-white border border-purple-200 text-purple-600 hover:bg-purple-100"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <input 
                                type="number" 
                                value={selectedQty}
                                onChange={(e) => updateTransferQty(item.id, parseInt(e.target.value) || 0)}
                                className="w-16 text-center font-bold bg-transparent border-none outline-none text-purple-700"
                              />
                              <button 
                                onClick={() => updateTransferQty(item.id, selectedQty + 1)}
                                className="p-1 rounded-md bg-white border border-purple-200 text-purple-600 hover:bg-purple-100"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50">
              <div className="flex items-center justify-between mb-4 px-2">
                <span className="text-slate-500">รายการที่เลือก: {transferData.length} รายการ</span>
                <span className="font-bold text-slate-800">ยืนยันการทำรายการ?</span>
              </div>
              <button 
                onClick={handleConfirmTransfer}
                className="w-full py-4 bg-purple-600 text-white font-bold rounded-2xl shadow-xl shadow-purple-200 hover:bg-purple-700 transition flex items-center justify-center gap-2"
              >
                <PackagePlus className="w-6 h-6" />
                เบิกพัสดุเข้าสู่ตัวรถ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Count Modal */}
      {isCounting && selectedVehicle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">ตรวจนับยอดคงเหลือจริง: {selectedVehicle.plateNumber}</h3>
              <button onClick={() => setIsCounting(false)} className="p-2 hover:bg-slate-100 rounded-full transition"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อผู้ส่งมอบ</label>
                  <input 
                    type="text" 
                    value={reporter}
                    onChange={(e) => setReporter(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-100 border-none rounded-xl outline-none"
                    placeholder="กรอกชื่อผู้ส่ง"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อผู้รับมอบ</label>
                  <input 
                    type="text" 
                    value={receiver}
                    onChange={(e) => setReceiver(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-100 border-none rounded-xl outline-none"
                    placeholder="กรอกชื่อผู้รับ"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-semibold text-slate-700">ระบุจำนวนที่นับได้จริง</p>
                {countData.map((item, idx) => {
                  const mainInfo = inventory.find(i => i.id === item.itemId);
                  const isBelowMin = item.actual < (mainInfo?.minThreshold || 0);
                  return (
                    <div key={item.itemId} className={`flex flex-col p-4 rounded-2xl border transition ${isBelowMin ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-slate-800">{mainInfo?.name}</p>
                          <p className="text-xs text-slate-400">ในระบบ: {selectedVehicle.items[idx].quantity} {mainInfo?.unit}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <input 
                            type="number"
                            value={item.actual}
                            onChange={(e) => {
                              const newData = [...countData];
                              newData[idx].actual = parseInt(e.target.value) || 0;
                              setCountData(newData);
                            }}
                            className={`w-24 px-3 py-2 bg-white border rounded-lg text-center font-bold outline-none focus:ring-2 ${isBelowMin ? 'border-red-300 focus:ring-red-500 text-red-600' : 'border-slate-200 focus:ring-purple-500'}`}
                          />
                          <span className="text-slate-400 w-10">{mainInfo?.unit}</span>
                        </div>
                      </div>
                      {isBelowMin && (
                        <div className="flex items-center gap-1.5 text-red-600 text-[11px] font-bold">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>จำนวนน้อยกว่าขั้นต่ำที่กำหนด ({mainInfo?.minThreshold} {mainInfo?.unit})</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50">
              <button 
                onClick={handleSaveCount}
                className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition flex items-center justify-center gap-2"
              >
                <Save className="w-6 h-6" />
                ยืนยันการบันทึกผลการตรวจนับ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scan Modal for Vehicle Transfer */}
      {isScanMode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                <Camera className="w-5 h-5 text-purple-600" />
                แสกนพัสดุเพื่อเบิกเข้ารถ
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
                  <div id="vehicle-reader" className="w-full h-full"></div>
                  <div className="absolute inset-0 border-2 border-purple-500/30 rounded-xl pointer-events-none animate-pulse"></div>
                </div>
              )}
              <p className="text-center text-slate-500 text-sm px-4">
                แสกน QR Code บนพัสดุเพื่อเพิ่มรายการในใบเบิก
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
    </div>
  );
};

export default VehicleManagement;
