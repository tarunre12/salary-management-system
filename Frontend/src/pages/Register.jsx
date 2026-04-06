import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { UserPlus, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({ FirstName: '', LastName: '', UserName: '', Email: '', Password: '', role: 'user' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/signup', formData);
      login(res.data.user);
      
      toast.success('Welcome to SalarySync!');
      if (res.data.user.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden py-10 px-4 font-sans selection:bg-indigo-500/30">
      {/* Ambient Background Blur */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[500px] bg-neutral-950/80 backdrop-blur-xl border border-neutral-800 rounded-[32px] shadow-2xl p-6 sm:p-10 relative z-10 transform transition-all hover:border-neutral-700 hover:shadow-indigo-500/10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-blue-400 to-cyan-400 tracking-tight mb-2">
            SalarySync
          </h1>
          <p className="text-neutral-400 font-medium text-sm">Join the platform to manage your workflow</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">First Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <User size={16} />
                </div>
                <input 
                  type="text" name="FirstName" value={formData.FirstName} onChange={handleChange} 
                  className="w-full pl-10 pr-4 py-3 bg-black/50 rounded-2xl border border-neutral-800 focus:bg-neutral-900 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-white font-medium placeholder:text-neutral-600 outline-none shadow-inner" 
                  placeholder="First Name" required 
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Last Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <User size={16} />
                </div>
                <input 
                  type="text" name="LastName" value={formData.LastName} onChange={handleChange} 
                  className="w-full pl-10 pr-4 py-3 bg-black/50 rounded-2xl border border-neutral-800 focus:bg-neutral-900 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-white font-medium placeholder:text-neutral-600 outline-none shadow-inner" 
                  placeholder="Last Name" required 
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
                <span className="font-bold text-lg leading-none shrink-0 mb-1">@</span>
              </div>
              <input 
                type="text" name="UserName" value={formData.UserName} onChange={handleChange} 
                className="w-full pl-11 pr-4 py-3.5 bg-black/50 rounded-2xl border border-neutral-800 focus:bg-neutral-900 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-white font-medium placeholder:text-neutral-600 outline-none shadow-inner" 
                placeholder="Username" required 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500">
                 <Mail size={18} />
              </div>
              <input 
                type="email" name="Email" value={formData.Email} onChange={handleChange} 
                className="w-full pl-11 pr-4 py-3.5 bg-black/50 rounded-2xl border border-neutral-800 focus:bg-neutral-900 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-white font-medium placeholder:text-neutral-600 outline-none shadow-inner" 
                placeholder="Email Address" required 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Lock size={16} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} name="Password" value={formData.Password} onChange={handleChange} 
                  className="w-full pl-10 pr-12 py-3 bg-black/50 rounded-2xl border border-neutral-800 focus:bg-neutral-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-white font-medium placeholder:text-neutral-600 outline-none shadow-inner" 
                  placeholder="Password" required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-500 hover:text-cyan-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Account Role</label>
              <div className="relative">
                <select 
                   name="role" value={formData.role} onChange={handleChange} 
                   className="w-full px-4 py-3 bg-black/50 rounded-2xl border border-neutral-800 focus:bg-neutral-900 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-white font-bold appearance-none outline-none cursor-pointer shadow-inner" 
                   required
                >
                  <option value="user" className="bg-neutral-950">Employee</option>
                  <option value="admin" className="bg-neutral-950">Admin</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-neutral-500">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-3.5 px-4 rounded-2xl hover:from-blue-400 hover:to-cyan-400 focus:ring-4 focus:ring-blue-500/20 transition-all active:scale-[0.98] mt-2 shadow-lg shadow-blue-500/20 border border-blue-400/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : <><UserPlus size={20} /> Create Account</>}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-neutral-800 flex flex-col items-center">
          <p className="text-neutral-500 font-medium text-sm">
            Already registered?
          </p>
          <Link to="/login" className="mt-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors">
            Sign In Instead
          </Link>
        </div>
      </div>
    </div>
  );
}
