import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Clock, Calendar, CheckCircle, Download, Power, IndianRupee } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isPunchedOutForDay, setIsPunchedOutForDay] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('all');
  

  const [history, setHistory] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statusRes, summaryRes] = await Promise.all([
        api.get('/attendance/status'),
        api.get('/attendance/summary')
      ]);

      const att = statusRes.data.attendance;
      if (att) {
        setIsCheckedIn(true);
        if (att.logoutTime) {
          setIsPunchedOutForDay(true);
        }
      }

      setHistory(summaryRes.data.history);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const filteredHistory = selectedMonth === 'all' 
    ? history 
    : history.filter(record => format(new Date(record.date), 'yyyy-MM') === selectedMonth);

  const displayedSummary = {
    totalHours: filteredHistory.reduce((acc, curr) => acc + (parseFloat(curr.hoursWorked) || 0), 0).toFixed(2),
    fullDays: filteredHistory.filter(r => r.status === 'Full Day').length,
    halfDays: filteredHistory.filter(r => r.status === 'Half Day').length,
    expectedSalary: filteredHistory.reduce((acc, curr) => acc + (curr.salaryEarned || 0), 0)
  };

  const handleAction = async () => {
    try {
      if (isPunchedOutForDay) {
        toast.info("You have already punched out for the day!");
        return;
      }

      if (!isCheckedIn) {
        await api.post('/attendance/punch-in');
        toast.success("Punched in successfully! Have a great day.", { icon: '☀️' });
        setIsCheckedIn(true);
      } else {
        await api.post('/attendance/punch-out');
        toast.success("Punched out successfully! See you tomorrow.", { icon: '👋' });
        setIsPunchedOutForDay(true);
        fetchData(); // Refresh summary and history
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed!');
    }
  };

  const downloadReport = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(59, 130, 246); // blue-500
      doc.text(`Monthly Salary Report`, 14, 22);
      
      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Employee: ${user?.FirstName} ${user?.LastName}`, 14, 32);
      doc.text(`Generated On: ${format(new Date(), 'dd MMM yyyy')}`, 14, 38);
      
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(14, 45, 180, 25, 'F');
      
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(`Total Hours: ${displayedSummary.totalHours} hrs`, 20, 53);
      doc.text(`Full Days: ${displayedSummary.fullDays}`, 80, 53);
      doc.text(`Half Days: ${displayedSummary.halfDays}`, 130, 53);
      
      doc.setFont(undefined, 'bold');
      doc.text(`Total Salary: Rs ${Number(displayedSummary.expectedSalary).toLocaleString()}`, 20, 62);
      doc.setFont(undefined, 'normal');

      const tableColumn = ["Date", "Clock In", "Clock Out", "Duration", "Status", "Salary"];
      const tableRows = [];

      filteredHistory.forEach(row => {
        const rowData = [
          format(new Date(row.date), 'dd MMM yyyy'),
          format(new Date(row.loginTime), 'hh:mm a'),
          row.logoutTime ? format(new Date(row.logoutTime), 'hh:mm a') : 'Active',
          row.hoursWorked ? `${row.hoursWorked} h` : '-',
          row.status,
          row.salaryEarned ? `Rs ${row.salaryEarned}` : '-'
        ];
        tableRows.push(rowData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 80,
        headStyles: { fillColor: [79, 70, 229] }, // indigo-600
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { top: 10 },
      });

      doc.save(`Salary_Report_${user?.FirstName}.pdf`);
      toast.success("PDF Downloaded Successfully");
    } catch(err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    }
  };

  const getActionBtnConfig = () => {
    if (isPunchedOutForDay) return { text: "Completed log for today", color: "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700", icon: <CheckCircle /> };
    if (!isCheckedIn) return { text: "Punch In", color: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]", icon: <Power size={24} /> };
    return { text: "Punch Out", color: "bg-rose-500/10 text-rose-400 border border-rose-500/50 hover:bg-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.3)]", icon: <Power size={24} /> };
  };

  const btnConfig = getActionBtnConfig();

  return (
    <div className="min-h-screen bg-black font-sans selection:bg-indigo-500/30 text-white">
      <nav className="bg-black/90 backdrop-blur-md sticky top-0 z-50 border-b border-neutral-800 shadow-sm px-4 md:px-8 py-4 flex justify-between items-center transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-xl">{user?.FirstName?.charAt(0) || 'S'}</span>
          </div>
          <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 tracking-tight">SalarySync</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-semibold text-neutral-200">Hi, {user?.FirstName || 'User'}</span>
            <span className="text-xs text-neutral-500 font-medium">{user?.role === 'user' ? 'Employee' : 'Admin'}</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-rose-400 hover:text-rose-300 bg-neutral-900 hover:bg-neutral-800 px-4 py-2 rounded-xl transition-all font-semibold active:scale-95 border border-neutral-800">
            <LogOut size={18} /> <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 mt-6 pb-20">
        
        {/* Action Hero Section */}
        <section className="mb-10 w-full relative">
          <div className="absolute inset-0 bg-neutral-900 rounded-[32px] border border-neutral-800 transform skew-y-1 -z-10 shadow-2xl"></div>
          <div className="bg-gradient-to-r from-blue-950/40 to-cyan-950/40 backdrop-blur-lg border border-neutral-800 rounded-[32px] p-6 md:p-8 lg:p-12 flex flex-col md:flex-row items-center justify-between shadow-xl">
            <div className="mb-8 md:mb-0 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Welcome back, {user?.FirstName}!</h2>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex bg-black/50 border border-neutral-700 rounded-xl overflow-hidden focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 transition-colors">
                  <input 
                    type="month" 
                    value={selectedMonth === 'all' ? '' : selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value || 'all')}
                    className="bg-transparent text-white px-4 py-2 focus:outline-none cursor-pointer"
                  />
                  {selectedMonth !== 'all' && (
                    <button onClick={() => setSelectedMonth('all')} className="px-3 hover:text-white text-neutral-500 bg-neutral-800/50 transition-colors font-semibold text-xs border-l border-neutral-700">
                      ALL
                    </button>
                  )}
                </div>
                <div className="text-sky-300 text-sm font-semibold uppercase tracking-wider">
                  {selectedMonth === 'all' ? 'Lifetime Summary' : `${format(new Date(selectedMonth + '-01'), 'MMMM yyyy')} Summary`}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center shadow-2xl rounded-2xl p-6 bg-black border border-neutral-800 w-full md:w-auto transform transition-transform hover:scale-105">
              <h3 className="font-bold text-neutral-500 tracking-widest uppercase text-xs mb-4">Current Shift</h3>
              <button 
                onClick={handleAction}
                disabled={isPunchedOutForDay || loading}
                className={`py-4 px-10 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg transition-all active:scale-95 w-full md:w-64 ${btnConfig.color}`}
              >
                {btnConfig.icon}
                {loading ? 'Processing...' : btnConfig.text}
              </button>
              {isCheckedIn && !isPunchedOutForDay && (
                <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div> Shift Active
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Total Target Salary", value: `₹${Number(displayedSummary.expectedSalary).toLocaleString()}`, icon: <IndianRupee size={24} className="text-indigo-400" />, bg: "bg-indigo-500/10", border: 'border-indigo-500/20' },
            { label: "Total Hours", value: `${displayedSummary.totalHours}h`, icon: <Clock size={24} className="text-blue-400" />, bg: "bg-blue-500/10", border: 'border-blue-500/20' },
            { label: "Full Days", value: displayedSummary.fullDays, icon: <CheckCircle size={24} className="text-emerald-400" />, bg: "bg-emerald-500/10", border: 'border-emerald-500/20' },
            { label: "Half Days", value: displayedSummary.halfDays, icon: <Calendar size={24} className="text-amber-400" />, bg: "bg-amber-500/10", border: 'border-amber-500/20' }
          ].map((stat, idx) => (
            <div key={idx} className="bg-neutral-900 rounded-3xl p-6 shadow-sm hover:shadow-indigo-500/10 hover:border-neutral-700 transition-all border border-neutral-800 flex items-center gap-5 group">
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.border} border group-hover:scale-110 transition-transform duration-300`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-500 tracking-wider uppercase mb-1">{stat.label}</p>
                <h4 className="text-3xl font-black text-white">{stat.value}</h4>
              </div>
            </div>
          ))}
        </section>

        {/* History & Export */}
        <section className="bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-800 overflow-hidden">
          <div className="px-8 py-6 flex flex-col sm:flex-row items-center justify-between border-b border-neutral-800 bg-black/40">
            <div>
              <h2 className="text-2xl font-bold text-white">Attendance Log</h2>
              <p className="text-neutral-400 text-sm mt-1">Detailed view of your working sessions.</p>
            </div>
            <button onClick={downloadReport} className="mt-4 sm:mt-0 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl transition-colors font-semibold shadow-lg shadow-indigo-500/20 active:scale-95 group border border-indigo-500/50">
              <Download size={18} className="group-hover:-translate-y-1 transition-transform" /> Export Report
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-black/20 border-b border-neutral-800 text-neutral-400 text-sm uppercase tracking-wider font-semibold">
                  <th className="px-8 py-4">Date</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4">Clock In</th>
                  <th className="px-8 py-4">Clock Out</th>
                  <th className="px-8 py-4">Hours</th>
                  <th className="px-8 py-4 text-right">Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80 text-neutral-300 font-medium">
                {filteredHistory.length > 0 ? filteredHistory.map((record) => (
                  <tr key={record._id} className="hover:bg-neutral-800/50 transition-colors">
                    <td className="px-8 py-5 text-white font-bold">{format(new Date(record.date), 'MMM dd, yyyy')}</td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-md ${
                        record.status === 'Full Day' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        record.status === 'Half Day' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        record.status === 'Quarter Day' ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20' :
                        record.status === 'Short Shift' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-8 py-5">{format(new Date(record.loginTime), 'hh:mm a')}</td>
                    <td className="px-8 py-5">{record.logoutTime ? format(new Date(record.logoutTime), 'hh:mm a') : <span className="text-blue-400 animate-pulse">Running</span>}</td>
                    <td className="px-8 py-5">{record.hoursWorked ? `${record.hoursWorked} hrs` : '-'}</td>
                    <td className="px-8 py-5 text-right font-bold text-indigo-400">{record.salaryEarned ? `₹${record.salaryEarned}` : '-'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-10 text-center text-neutral-600">
                      <div className="flex flex-col items-center justify-center">
                        <Calendar size={48} className="mb-4 opacity-20" />
                        <p>No attendance records found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        
      </main>
    </div>
  );
}
