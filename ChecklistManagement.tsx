
import React, { useState } from 'react';
import { VehicleInventory, EquipmentChecklist } from '../types';
import { TOOL_LIST } from '../constants';
import { ClipboardCheck, CheckCircle2, Circle, AlertCircle, User, X, Save, Download, ArrowRightLeft, XCircle, AlertTriangle, Wrench } from 'lucide-react';

interface ChecklistManagementProps {
  vehicles: VehicleInventory[];
  checklists: EquipmentChecklist[];
  onAddChecklist: (cl: EquipmentChecklist) => void;
}

const ChecklistManagement: React.FC<ChecklistManagementProps> = ({ vehicles, checklists, onAddChecklist }) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [checklistData, setChecklistData] = useState<{toolName: string, status: 'READY' | 'MISSING' | 'DAMAGED'}[]>(
    TOOL_LIST.map(tool => ({ toolName: tool, status: 'READY' }))
  );
  const [personnel, setPersonnel] = useState({ sender: '', receiver: '' });

  const handleSave = () => {
    if (!selectedVehicleId || !personnel.sender || !personnel.receiver) {
      alert('กรุณากรอกข้อมูลรถและผู้ส่ง-ผู้รับให้ครบถ้วน');
      return;
    }

    const newChecklist: EquipmentChecklist = {
      id: `CL-${Date.now()}`,
      vehicleId: selectedVehicleId,
      date: new Date().toISOString(),
      sender: personnel.sender,
      receiver: personnel.receiver,
      tools: checklistData
    };

    onAddChecklist(newChecklist);
    setIsCreating(false);
    // Reset form
    setPersonnel({ sender: '', receiver: '' });
    setChecklistData(TOOL_LIST.map(tool => ({ toolName: tool, status: 'READY' })));
    alert('บันทึกเช็คลิสต์อุปกรณ์เรียบร้อยแล้ว');
  };

  const exportChecklists = () => {
    if (checklists.length === 0) {
      alert('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + "วันที่,หมายเลขรถ,ผู้ส่งมอบ,ผู้รับมอบ,ชื่ออุปกรณ์,สถานะ\n"
      + checklists.map(cl => {
          const vehicle = vehicles.find(v => v.vehicleId === cl.vehicleId);
          return cl.tools.map(tool => {
            const statusText = tool.status === 'READY' ? 'ปกติ' : tool.status === 'MISSING' ? 'ขาด' : 'ชำรุด';
            return `${new Date(cl.date).toLocaleDateString('th-TH')},${vehicle?.plateNumber || cl.vehicleId},${cl.sender},${cl.receiver},${tool.toolName},${statusText}`;
          }).join('\n');
      }).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `equipment_checklists_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-slate-800">ประวัติการเช็คลิสต์อุปกรณ์</h3>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={exportChecklists}
            className="flex-1 sm:flex-none px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            <span>ส่งออก (.CSV)</span>
          </button>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition flex items-center justify-center gap-2"
          >
            <ClipboardCheck className="w-5 h-5" />
            <span>เช็คลิสต์ใหม่</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {checklists.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            <ClipboardCheck className="w-12 h-12 mx-auto opacity-20 mb-4" />
            <p>ยังไม่มีประวัติการเช็คลิสต์อุปกรณ์</p>
          </div>
        ) : (
          checklists.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(cl => {
            const vehicle = vehicles.find(v => v.vehicleId === cl.vehicleId);
            const missingItems = cl.tools.filter(t => t.status === 'MISSING');
            const damagedItems = cl.tools.filter(t => t.status === 'DAMAGED');
            const hasIssues = missingItems.length > 0 || damagedItems.length > 0;

            return (
              <div key={cl.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg ${hasIssues ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                    {hasIssues ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <span className="text-xs font-medium text-slate-400">{new Date(cl.date).toLocaleDateString('th-TH')}</span>
                </div>
                <p className="font-bold text-slate-800 text-lg">รถหมายเลข: {vehicle?.plateNumber}</p>
                
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">ผู้ส่งมอบ</p>
                      <p className="font-medium truncate">{cl.sender}</p>
                    </div>
                    <ArrowRightLeft className="w-3 h-3 text-slate-300" />
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">ผู้รับมอบ</p>
                      <p className="font-medium truncate">{cl.receiver}</p>
                    </div>
                  </div>

                  {hasIssues && (
                    <div className="flex flex-wrap gap-1.5">
                      {missingItems.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                          <XCircle className="w-3 h-3" /> ขาด {missingItems.length}
                        </span>
                      )}
                      {damagedItems.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3" /> ชำรุด {damagedItems.length}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs py-1.5 px-3 bg-slate-50 rounded-lg">
                    <span className={hasIssues ? 'text-red-500 font-bold' : 'text-emerald-500 font-bold'}>
                      {hasIssues ? 'พบปัญหาอุปกรณ์' : 'อุปกรณ์ครบถ้วน'}
                    </span>
                    <button className="text-purple-600 hover:underline font-medium">ดูรายการ</button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Checklist Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">สร้างเช็คลิสต์อุปกรณ์ประจำรถ</h3>
              <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-slate-100 rounded-full transition"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">เลือกรถที่ตรวจสอบ</label>
                  <select 
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">-- กรุณาเลือกรถ --</option>
                    {vehicles.map(v => <option key={v.vehicleId} value={v.vehicleId}>{v.plateNumber}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ผู้ส่งมอบ</label>
                    <input 
                      type="text" 
                      value={personnel.sender}
                      onChange={(e) => setPersonnel({...personnel, sender: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="ชื่อผู้ส่ง"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ผู้รับมอบ</label>
                    <input 
                      type="text" 
                      value={personnel.receiver}
                      onChange={(e) => setPersonnel({...personnel, receiver: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="ชื่อผู้รับ"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-semibold text-slate-700 flex items-center justify-between">
                  <span>สถานะอุปกรณ์</span>
                  <span className="text-xs font-normal text-slate-400">ระบุสภาพของอุปกรณ์แต่ละชิ้น</span>
                </p>
                <div className="space-y-2">
                  {checklistData.map((tool, idx) => (
                    <div key={tool.toolName} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition gap-3">
                      <span className="font-medium text-slate-700">{tool.toolName}</span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            const newData = [...checklistData];
                            newData[idx].status = 'READY';
                            setChecklistData(newData);
                          }}
                          className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${tool.status === 'READY' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-100' : 'bg-slate-100 text-slate-400'}`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> ปกติ
                        </button>
                        <button 
                          onClick={() => {
                            const newData = [...checklistData];
                            newData[idx].status = 'MISSING';
                            setChecklistData(newData);
                          }}
                          className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${tool.status === 'MISSING' ? 'bg-red-500 text-white shadow-md shadow-red-100' : 'bg-slate-100 text-slate-400'}`}
                        >
                          <XCircle className="w-3.5 h-3.5" /> ขาด
                        </button>
                        <button 
                          onClick={() => {
                            const newData = [...checklistData];
                            newData[idx].status = 'DAMAGED';
                            setChecklistData(newData);
                          }}
                          className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${tool.status === 'DAMAGED' ? 'bg-orange-500 text-white shadow-md shadow-orange-100' : 'bg-slate-100 text-slate-400'}`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" /> ชำรุด
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50">
              <button 
                onClick={handleSave}
                className="w-full py-4 bg-purple-600 text-white font-bold rounded-2xl shadow-xl shadow-purple-200 hover:bg-purple-700 transition flex items-center justify-center gap-2"
              >
                <Save className="w-6 h-6" />
                ยืนยันการบันทึกเช็คลิสต์
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChecklistManagement;
