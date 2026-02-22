
import React from 'react';
import { InventoryItem, VehicleInventory } from '../types';
import { Package, AlertTriangle, Truck, Activity, Settings, ChevronRight, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  inventory: InventoryItem[];
  vehicles: VehicleInventory[];
  lowStockCount: number;
  onResetData?: () => void;
  onImportData?: (data: { inventory: InventoryItem[], vehicles: VehicleInventory[] }) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ inventory, vehicles, lowStockCount, onResetData, onImportData }) => {
  const chartData = inventory.map(item => ({
    name: item.name,
    quantity: item.quantity,
    min: item.minThreshold
  })).slice(0, 5);

  const handleExportData = () => {
    const data = {
      inventory,
      vehicles,
      exportDate: new Date().toISOString(),
      version: '1.2'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PEA_BPN_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.inventory && data.vehicles) {
          if (confirm('ยืนยันการนำเข้าข้อมูล? ข้อมูลปัจจุบันจะถูกเขียนทับ')) {
            onImportData?.({ inventory: data.inventory, vehicles: data.vehicles });
            alert('นำเข้าข้อมูลสำเร็จ');
          }
        } else {
          alert('รูปแบบไฟล์ไม่ถูกต้อง');
        }
      } catch (err) {
        alert('ไม่สามารถอ่านไฟล์ได้');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end gap-2">
        <label className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 cursor-pointer hover:bg-slate-50 transition flex items-center gap-1">
          <Download className="w-3 h-3 rotate-180" />
          นำเข้าข้อมูล (Restore)
          <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
        </label>
        <button 
          onClick={handleExportData}
          className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 transition flex items-center gap-1"
        >
          <Download className="w-3 h-3" />
          สำรองข้อมูล (Backup)
        </button>
        <button 
          onClick={() => {
            if(confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดเป็นค่าเริ่มต้นใช่หรือไม่? (ข้อมูลที่บันทึกไว้จะหายไป)')) {
              onResetData?.();
            }
          }}
          className="text-xs text-slate-400 hover:text-slate-600 transition flex items-center gap-1"
        >
          <Settings className="w-3 h-3" />
          รีเซ็ตข้อมูลระบบ
        </button>
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 transition-all hover:shadow-md">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-sm text-slate-400 font-bold uppercase tracking-wider">พัสดุทั้งหมด</p>
            <p className="text-xl md:text-2xl font-black text-slate-800">{inventory.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 transition-all hover:shadow-md">
          <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-sm text-slate-400 font-bold uppercase tracking-wider">ต้องสั่งเพิ่ม</p>
            <p className="text-xl md:text-2xl font-black text-red-600">{lowStockCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 transition-all hover:shadow-md">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-sm text-slate-400 font-bold uppercase tracking-wider">รถแก้ไฟ</p>
            <p className="text-xl md:text-2xl font-black text-slate-800">{vehicles.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 transition-all hover:shadow-md">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-sm text-slate-400 font-bold uppercase tracking-wider">สถานะระบบ</p>
            <p className="text-xl md:text-2xl font-black text-emerald-600">ปกติ</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-black text-slate-800 tracking-tight">พัสดุที่ใกล้หมด (5 อันดับแรก)</h4>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
              <span className="text-xs text-slate-400 font-bold uppercase">จำนวนคงเหลือ</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                  interval={0}
                  tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="quantity" radius={[6, 6, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.quantity <= entry.min ? '#ef4444' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock List */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
          <h4 className="font-black text-slate-800 tracking-tight mb-6">แจ้งเตือนพัสดุใกล้หมด</h4>
          <div className="space-y-3 flex-1">
            {inventory.filter(i => i.quantity <= i.minThreshold).map(item => (
              <div key={item.id} className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-between transition-all hover:scale-[1.02]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <Package className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                    <p className="text-[10px] text-red-600 font-bold uppercase">เหลือ {item.quantity} {item.unit}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-red-300" />
              </div>
            ))}
            {lowStockCount === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Package className="w-12 h-12 opacity-20 mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest">คลังพัสดุปกติ</p>
              </div>
            )}
          </div>
          <div className="mt-6 pt-6 border-t border-slate-50">
            <p className="text-xs text-slate-400 text-center font-medium italic">อัปเดตล่าสุด: {new Date().toLocaleTimeString('th-TH')}</p>
          </div>
        </div>
      </div>

      {/* User Guide Section */}
      <div className="bg-purple-900 text-white p-6 md:p-8 rounded-3xl shadow-xl shadow-purple-200 relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-xl md:text-2xl font-black mb-4">คู่มือการใช้งานจริง (Quick Start)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-black">1</div>
              <p className="font-bold">ตั้งค่าพัสดุ</p>
              <p className="text-xs text-purple-100 opacity-80">เพิ่มรายการพัสดุจริงในเมนู "คลังหลัก" และพิมพ์ QR Code ตามรหัสพัสดุ (ID) ติดไว้ที่ชั้นวาง</p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-black">2</div>
              <p className="font-bold">เบิกของเข้ารถ</p>
              <p className="text-xs text-purple-100 opacity-80">เมื่อรถจะออกงาน ให้แสกน QR เพื่อย้ายพัสดุจากคลังหลักเข้าสู่รถ ระบบจะตัดสต็อกอัตโนมัติ</p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-black">3</div>
              <p className="font-bold">ตรวจนับ & รายงาน</p>
              <p className="text-xs text-purple-100 opacity-80">ใช้เมนู "ตรวจนับประจำวัน" เพื่อยืนยันยอดคงเหลือจริง และส่งออกรายงานเป็นไฟล์ Excel (.CSV)</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
      </div>
    </div>
  );
};

export default Dashboard;
