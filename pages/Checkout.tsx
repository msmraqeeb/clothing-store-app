
import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { Truck, ChevronDown, Loader2, CreditCard, Ticket, AlertCircle } from 'lucide-react';
import { DISTRICT_AREA_DATA } from '../constants';

const Checkout: React.FC = () => {
  const { cart, appliedCoupon, placeOrder, shippingSettings, user, userProfile, addresses } = useStore();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    district: '',
    area: '',
    phone: '',
    email: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const defaultAddress = addresses.length > 0 ? addresses[0] : null;
      setFormData(prev => ({
        ...prev,
        fullName: userProfile?.full_name || user.user_metadata?.full_name || prev.fullName,
        email: user.email || prev.email,
        phone: defaultAddress?.phone || prev.phone,
        address: defaultAddress?.addressLine || prev.address,
        district: defaultAddress?.district || prev.district,
        area: defaultAddress?.area || prev.area
      }));
    }
  }, [user, userProfile, addresses]);
  
  const districts = Object.keys(DISTRICT_AREA_DATA).sort((a, b) => a.localeCompare(b));
  const areas = formData.district ? DISTRICT_AREA_DATA[formData.district] : [];

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const isDhaka = formData.district?.toLowerCase() === 'dhaka';
  const shipping = formData.district ? (isDhaka ? shippingSettings.insideDhaka : shippingSettings.outsideDhaka) : 0;
  
  let discount = 0;
  if (appliedCoupon) {
      discount = appliedCoupon.discountType === 'Fixed' ? appliedCoupon.discountValue : (subtotal * appliedCoupon.discountValue / 100);
  }
  const total = subtotal + shipping - discount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'district') setFormData(prev => ({ ...prev, [name]: value, area: '' }));
    else setFormData(prev => ({ ...prev, [name]: value }));
    setCheckoutError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setCheckoutError(null);
    try {
      const order = await placeOrder(formData);
      navigate(`/order-success/${order.id}`, { 
        state: { order },
        replace: true 
      });
    } catch (err: any) {
      console.error("Detailed Checkout Error:", err);
      
      // PARANOID ERROR PARSING: Ensure we never show [object Object]
      let msg = "Something went wrong while processing your order.";
      
      if (err) {
        if (typeof err === 'string') {
          msg = err;
        } else if (err.message && typeof err.message === 'string') {
          msg = err.message;
        } else if (err.details && typeof err.details === 'string') {
          msg = err.details;
        } else if (err.error_description && typeof err.error_description === 'string') {
          msg = err.error_description;
        } else {
          try {
            msg = JSON.stringify(err);
            // If stringified error is just empty object string
            if (msg === '{}' || msg === '[]') msg = "Database connection error. Please ensure the SQL script was run in Supabase.";
          } catch (e) {
            msg = "An unexpected error occurred. Please check your internet connection.";
          }
        }
      }
      
      setCheckoutError(msg);
      setIsSubmitting(false);
      alert(`Checkout Failed: ${msg}`);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <button onClick={() => navigate('/')} className="bg-[#00a651] text-white px-8 py-3 rounded-xl font-bold">Return to Store</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10 font-sans">
      <div className="container mx-auto px-4 md:px-8">
        <h1 className="text-3xl font-black text-gray-800 mb-8 tracking-tight uppercase">Checkout</h1>
        
        {checkoutError && (
          <div className="mb-8 bg-red-50 border border-red-100 rounded-2xl p-6 flex items-start gap-4 animate-in slide-in-from-top-4 duration-300 shadow-sm">
             <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-red-500 shrink-0 border border-red-50">
                <AlertCircle size={28} />
             </div>
             <div className="pt-1">
               <h4 className="font-black text-red-800 uppercase text-[10px] tracking-[2px] mb-1">Processing Error</h4>
               <p className="text-sm font-bold text-red-600/90 leading-relaxed">{checkoutError}</p>
             </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 md:p-12">
              <h2 className="text-xl font-black text-gray-800 mb-10 flex items-center gap-4 uppercase tracking-tighter">
                <span className="w-10 h-10 rounded-2xl bg-[#e6fbf2] text-[#00a651] flex items-center justify-center text-lg font-black border border-emerald-100">01</span>
                Shipping Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input required name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Recipient Name" className="w-full bg-[#f8f9fa] border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:border-[#00a651] transition-all text-gray-800 font-bold" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input required name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="email@example.com" className="w-full bg-[#f8f9fa] border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:border-[#00a651] transition-all text-gray-800 font-bold" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Street Address</label>
                  <input required name="address" value={formData.address} onChange={handleInputChange} placeholder="House #, Road #" className="w-full bg-[#f8f9fa] border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:border-[#00a651] transition-all text-gray-800 font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">District/Zilla</label>
                  <div className="relative">
                    <select required name="district" value={formData.district} onChange={handleInputChange} className="w-full bg-[#f8f9fa] border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:border-[#00a651] transition-all appearance-none text-gray-800 font-bold">
                      <option value="" disabled hidden>Select District</option>
                      {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Area</label>
                  <div className="relative">
                    <select required name="area" value={formData.area} onChange={handleInputChange} disabled={!formData.district} className={`w-full bg-[#f8f9fa] border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:border-[#00a651] transition-all appearance-none text-gray-800 font-bold ${!formData.district ? 'opacity-50' : ''}`}>
                      <option value="" disabled hidden>Select Area</option>
                      {areas.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18} />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <input required name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="01XXXXXXXXX" className="w-full bg-[#f8f9fa] border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:bg-white focus:border-[#00a651] transition-all text-gray-800 font-bold" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 md:p-12">
               <h2 className="text-xl font-black text-gray-800 mb-8 flex items-center gap-4 uppercase tracking-tighter"><span className="w-10 h-10 rounded-2xl bg-[#e6fbf2] text-[#00a651] flex items-center justify-center text-lg font-black border border-emerald-100">02</span>Payment Method</h2>
               <div className="space-y-4">
                <label className="flex items-center gap-6 p-8 border-2 border-[#00a651] bg-emerald-50/20 rounded-[2rem] cursor-pointer shadow-xl shadow-emerald-50/20 transition-transform active:scale-[0.99]">
                  <input type="radio" name="payment" defaultChecked className="w-6 h-6 accent-[#00a651]" />
                  <div className="flex-1">
                    <span className="font-black text-gray-800 text-lg block leading-none mb-2">Cash on Delivery</span>
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-[1px]">Standard delivery in 2-3 business days.</span>
                  </div>
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#00a651] shadow-md">
                    <Truck size={28} />
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
             <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-emerald-900/5 border border-gray-100 p-8 md:p-10 sticky top-24 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
              <h2 className="text-2xl font-black text-[#004d40] mb-10 uppercase tracking-tighter border-b border-gray-50 pb-6 relative z-10">Summary</h2>
              <div className="space-y-6 mb-10 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar relative z-10">
                {cart.map(item => {
                  const itemKey = item.selectedVariantId ? `${item.id}-${item.selectedVariantId}` : item.id;
                  return (
                    <div key={itemKey} className="flex gap-5 group items-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center p-2 border border-gray-100 flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                        <img src={item.selectedVariantImage || item.images?.[0] || ''} alt={item.name} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] font-bold text-gray-800 leading-tight mb-1 truncate">{item.name}</h4>
                        <div className="text-[10px] text-[#00a651] font-black uppercase tracking-widest bg-emerald-50 w-fit px-2 py-0.5 rounded-lg border border-emerald-100">Qty: {item.quantity}</div>
                      </div>
                      <div className="text-sm font-black text-gray-800 whitespace-nowrap">৳{(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
              
              <div className="border-t border-gray-50 pt-8 space-y-5 relative z-10">
                <div className="flex justify-between text-[14px] font-bold text-gray-400 uppercase tracking-widest"><span>Subtotal</span><span className="text-gray-800">৳{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-[14px] font-bold text-gray-400 uppercase tracking-widest"><span>Shipping</span><span className="text-gray-800">৳{shipping.toFixed(2)}</span></div>
                
                {appliedCoupon && (
                  <div className="flex justify-between text-[14px] font-black text-[#00a651] items-center bg-emerald-50 p-4 rounded-2xl border border-emerald-100 animate-in slide-in-from-right-2">
                    <span className="flex items-center gap-2"><Ticket size={14}/> {appliedCoupon.code}</span>
                    <span>-৳{discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-8 border-t border-gray-100">
                  <span className="text-xl font-black text-[#004d40] uppercase tracking-tighter">Total</span>
                  <div className="text-right">
                    <span className="text-4xl font-black text-gray-900 tracking-tighter">৳{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className={`w-full mt-10 text-white font-black py-6 rounded-[20px] shadow-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-[2px] text-[16px] relative z-10 ${isSubmitting ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-[#00a651] hover:bg-[#008c44] shadow-emerald-100/50 active:scale-95'}`}
              >
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirm Order'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
