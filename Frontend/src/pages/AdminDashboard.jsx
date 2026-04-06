import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, IndianRupee, PieChart, Activity, Search, Download, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [usersData, setUsersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendance/all');
      setUsersData(res.data);
    } catch (error) {
      toast.error('Failed to load admin data');
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

  const downloadReport = () => {
    try {
      if(usersData.length === 0) {
        toast.error("No data available to export.");
        return;
      }
      
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229); // indigo-600
      doc.text(`Global Salary Report`, 14, 22);
      
      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139);
      doc.text(`Administrator: ${user?.FirstName} ${user?.LastName}`, 14, 32);
      doc.text(`Generated On: ${format(new Date(), 'dd MMM yyyy')}`, 14, 38);

      const tableColumn = ["Employee", "Email", "Full Days", "Half Days", "Total Hours", "Salary Pay"];
      const tableRows = [];

      const currentFilteredUsers = activeUserData.filter(u => 
        u.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );

      currentFilteredUsers.forEach(u => {
        const rowData = [
          `${u.user.firstName} ${u.user.lastName}`,
          u.user.email,
          u.stats.fullDays.toString(),
          u.stats.halfDays.toString(),
          `${u.stats.totalHours} h`,
          `Rs ${u.stats.totalSalary.toLocaleString()}`
        ];
        tableRows.push(rowData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        headStyles: { fillColor: [79, 70, 229] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { top: 10 },
      });

      doc.save(`Admin_Salary_Report_${format(new Date(), 'MMM_yyyy')}.pdf`);
      toast.success("Admin Report Downloaded Successfully");
    } catch(err) {
      console.error(err);
      toast.error("Failed to generate Admin PDF");
    }
  };

  const activeUserData = usersData.map(u => {
     const monthlyHistory = selectedMonth === 'all' 
       ? u.history 
       : u.history.filter(record => format(new Date(record.date), 'yyyy-MM') === selectedMonth);
     
     const monthlyStats = {
        fullDays: monthlyHistory.filter(r => r.status === 'Full Day').length,
        halfDays: monthlyHistory.filter(r => r.status === 'Half Day').length,
        quarterDays: monthlyHistory.filter(r => r.status === 'Quarter Day').length,
        totalHours: monthlyHistory.reduce((acc, curr) => acc + (parseFloat(curr.hoursWorked) || 0), 0).toFixed(2),
        totalSalary: monthlyHistory.reduce((acc, curr) => acc + (curr.salaryEarned || 0), 0)
     };

     return {
        user: u.user,
        history: monthlyHistory,
        stats: monthlyStats
     };
  });

  const parsedDataForCounters = activeUserData; // We can use filteredUsers but active is better for global KPI 
  
  const totalPayout = parsedDataForCounters.reduce((acc, curr) => acc + curr.stats.totalSalary, 0);
  const totalHours = parsedDataForCounters.reduce((acc, curr) => acc + parseFloat(curr.stats.totalHours), 0).toFixed(2);
  const totalEmployees = parsedDataForCounters.length;

  const filteredUsers = activeUserData.filter(u => 
    u.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black font-sans selection:bg-indigo-500/30">
      <nav className="bg-black border-b border-neutral-900 sticky top-0 z-50 px-4 md:px-8 py-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Activity size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-wider">SalarySync<span className="font-light text-cyan-400">Admin</span></h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-semibold text-neutral-200">{user?.FirstName || 'System'}</span>
            <span className="text-xs text-cyan-400 font-medium">Administrator</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-rose-400 hover:text-rose-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-4 py-2 rounded-xl transition-colors font-semibold active:scale-95">
            <LogOut size={18} /> <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 mt-6 pb-20">
        
        {/* Header section */}
        <div className="mb-10 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
           <div>
             <h2 className="text-3xl font-bold flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
               Command Center
             </h2>
             <p className="text-neutral-400 mt-2 text-lg">Monitor company attendance patterns and expected payouts.</p>
           </div>
           
           <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 shadow-lg w-full md:w-auto">
             <div className="flex flex-col">
               <label className="text-xs text-neutral-500 font-bold uppercase tracking-widest mb-1">Select Period</label>
               <div className="flex bg-black border border-neutral-700 rounded-xl overflow-hidden focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 transition-colors">
                 <input 
                   type="month" 
                   value={selectedMonth === 'all' ? '' : selectedMonth} 
                   onChange={(e) => setSelectedMonth(e.target.value || 'all')}
                   className="bg-transparent text-white px-4 py-2 focus:outline-none cursor-pointer w-full"
                 />
                 {selectedMonth !== 'all' && (
                   <button onClick={() => setSelectedMonth('all')} className="px-3 hover:text-white text-neutral-500 bg-neutral-800/50 transition-colors font-semibold text-xs border-l border-neutral-700">
                     ALL
                   </button>
                 )}
               </div>
             </div>
             <button onClick={downloadReport} className="mt-4 sm:mt-5 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl transition-colors font-semibold shadow-lg shadow-indigo-500/20 active:scale-95 border border-indigo-500/50 text-sm whitespace-nowrap">
               <Download size={16} /> Export Master Report
             </button>
           </div>
        </div>

        {/* KPI Widgets */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-neutral-900 rounded-3xl p-8 border border-neutral-800 hover:border-indigo-500/50 transition-colors group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm uppercase tracking-wider font-semibold text-neutral-500">Total Workforce</h3>
              <div className="w-12 h-12 rounded-full bg-black border border-neutral-800 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
            </div>
            <p className="text-5xl font-black text-white">{totalEmployees}</p>
          </div>
          
          <div className="bg-neutral-900 rounded-3xl p-8 border border-neutral-800 hover:border-emerald-500/50 transition-colors group relative overflow-hidden">
             <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/5 blur-3xl rounded-full"></div>
             <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm uppercase tracking-wider font-semibold text-neutral-500">Est. Payouts</h3>
              <div className="w-12 h-12 rounded-full bg-black border border-neutral-800 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <IndianRupee size={24} />
              </div>
            </div>
            <p className="text-5xl font-black text-white">₹{totalPayout.toLocaleString()}</p>
          </div>

          <div className="bg-neutral-900 rounded-3xl p-8 border border-neutral-800 hover:border-cyan-500/50 transition-colors group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm uppercase tracking-wider font-semibold text-neutral-500">Total Man-Hours</h3>
              <div className="w-12 h-12 rounded-full bg-black border border-neutral-800 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <PieChart size={24} />
              </div>
            </div>
            <p className="text-5xl font-black text-white">{totalHours}<span className="text-2xl text-neutral-600 ml-1">h</span></p>
          </div>
        </section>

        {/* Employee Roster */}
        <section className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden shadow-2xl">
          <div className="px-8 py-6 flex flex-col md:flex-row items-center justify-between border-b border-neutral-800/50 bg-black/40">
            <h3 className="text-xl font-bold text-white mb-4 md:mb-0">Employee Roster Metrics</h3>
            <div className="relative w-full md:w-72 mt-4 md:mt-0">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <Search size={18} className="text-neutral-500" />
               </div>
               <input 
                 type="text" 
                 placeholder="Search team..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="bg-black border border-neutral-800 text-white rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-neutral-600"
               />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-black/60 text-neutral-500 text-xs uppercase tracking-widest font-bold border-b border-neutral-800">
                  <th className="px-8 py-5">Employee</th>
                  <th className="px-8 py-5">Full Days</th>
                  <th className="px-8 py-5">Half Days</th>
                  <th className="px-8 py-5 text-center">Total Hours</th>
                  <th className="px-8 py-5 text-right">Accumulated Salary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-neutral-300 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-10 text-center">
                       <span className="text-neutral-500 font-bold animate-pulse">Loading dataset...</span>
                    </td>
                  </tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((item, index) => (
                    <tr 
                      key={index} 
                      onClick={() => setSelectedUser(item)}
                      className="hover:bg-neutral-800/30 transition-colors group cursor-pointer"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-black text-white font-bold flex items-center justify-center border border-neutral-700 shadow-sm">
                              {item.user.firstName.charAt(0)}
                           </div>
                           <div>
                             <p className="text-white font-bold text-base">{item.user.firstName} {item.user.lastName}</p>
                             <p className="text-neutral-500 text-xs mt-0.5">{item.user.email}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-md text-sm font-bold shadow-inner">
                          {item.stats.fullDays}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                         <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-md text-sm font-bold shadow-inner">
                          {item.stats.halfDays}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-center font-bold text-neutral-400">
                        {item.stats.totalHours} <span className="text-xs font-normal">hrs</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                         <span className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                           ₹{item.stats.totalSalary.toLocaleString()}
                         </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-neutral-600">
                      No employees found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-5xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-neutral-800 bg-black/40">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedUser.user.firstName} {selectedUser.user.lastName}</h2>
                <p className="text-neutral-400 text-sm mt-1">{selectedUser.user.email} &bull; {selectedUser.history?.length || 0} Log Entries</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full text-neutral-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="overflow-y-auto p-4 sm:p-6 flex-1 bg-black/20">
              <div className="overflow-x-auto rounded-2xl border border-neutral-800">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-black/80 text-neutral-500 text-xs uppercase tracking-widest font-bold border-b border-neutral-800">
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Clock In</th>
                      <th className="px-6 py-4">Clock Out</th>
                      <th className="px-6 py-4">Hours</th>
                      <th className="px-6 py-4 text-right">Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/80 text-neutral-300 font-medium">
                    {selectedUser.history && selectedUser.history.length > 0 ? selectedUser.history.map((record, i) => (
                      <tr key={i} className="hover:bg-neutral-800/50 transition-colors bg-neutral-900">
                        <td className="px-6 py-4 text-white font-bold">{format(new Date(record.date), 'MMM dd, yyyy')}</td>
                        <td className="px-6 py-4">
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
                        <td className="px-6 py-4">{format(new Date(record.loginTime), 'hh:mm a')}</td>
                        <td className="px-6 py-4">{record.logoutTime ? format(new Date(record.logoutTime), 'hh:mm a') : <span className="text-blue-400 animate-pulse">Running</span>}</td>
                        <td className="px-6 py-4">{record.hoursWorked ? `${record.hoursWorked} hrs` : '-'}</td>
                        <td className="px-6 py-4 text-right font-bold text-cyan-400">{record.salaryEarned ? `₹${record.salaryEarned}` : '-'}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={6} className="p-8 text-center text-neutral-600 bg-neutral-900">No attendance records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
