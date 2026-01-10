
import React from 'react';
import { Target, Heart, ShieldCheck, Zap, Users, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Link } from 'react-router-dom';

const AboutUs: React.FC = () => {
  const { storeInfo } = useStore();

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1600"
            className="w-full h-full object-cover brightness-50"
            alt="Fresh Vegetables"
          />
        </div>
        <div className="container mx-auto px-4 md:px-8 relative z-10 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">Our Mission is Freshness</h1>
          <p className="text-lg md:text-xl text-emerald-50 font-medium max-w-2xl mx-auto">
            Providing high-quality, organic, and farm-fresh groceries delivered straight to your doorstep since 2023.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="container mx-auto px-4 md:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-none">Our Story</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">From Local Farm to <br /><span className="text-emerald-500">Your Family Table</span></h2>
            <p className="text-gray-600 leading-loose">
              {storeInfo.name} began with a simple observation: getting truly fresh, high-quality groceries in the city was harder than it should be. We started as a small local initiative connecting three organic farms with families in our neighborhood.
            </p>
            <p className="text-gray-600 leading-loose">
              Today, we have grown into a premium grocery destination, partnering with over 50 local producers to bring you the finest selection of fruits, vegetables, meats, and daily essentials. Our commitment to quality remains as strong as the day we started.
            </p>
            <div className="flex gap-8 pt-4">
              <div>
                <div className="text-3xl font-black text-emerald-500">10k+</div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Happy Customers</div>
              </div>
              <div>
                <div className="text-3xl font-black text-emerald-500">500+</div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fresh Products</div>
              </div>
              <div>
                <div className="text-3xl font-black text-emerald-500">24h</div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Delivery Promise</div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-none overflow-hidden shadow-2xl shadow-emerald-100">
              <img
                src="https://dnaziaddhwmqalwrdgex.supabase.co/storage/v1/object/public/product-images/about-us.png"
                alt="About Us"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-none shadow-xl border border-emerald-50 flex items-center gap-4 animate-bounce-slow">
              <div className="w-12 h-12 bg-emerald-500 rounded-none flex items-center justify-center text-white">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900">100% Organic</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Certified Source</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4 md:px-8 text-center mb-16">
          <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">The Values We Live By</h2>
          <p className="text-gray-500 max-w-xl mx-auto font-medium">We don't just sell groceries; we nourish communities through our core principles.</p>
        </div>
        <div className="container mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { icon: Heart, title: 'Quality First', desc: 'Every item is hand-picked and inspected for peak freshness before it reaches your door.' },
            { icon: Users, title: 'Community Driven', desc: 'We support local farmers and producers, ensuring fair trade and sustainable growth.' },
            { icon: Zap, title: 'Efficiency', desc: 'Our logistics chain is optimized to reduce delivery times and minimize environmental impact.' },
            { icon: ShieldCheck, title: 'Food Safety', desc: 'Strict hygiene protocols and cold-chain management from storage to delivery.' },
            { icon: Target, title: 'Transparency', desc: 'Full traceability of where your food comes from and how it was produced.' },
            { icon: ShoppingBag, title: 'Convenience', desc: 'Building a seamless shopping experience that fits perfectly into your busy lifestyle.' },
          ].map((value, i) => (
            <div key={i} className="bg-white p-10 rounded-none border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all group">
              <div className="w-14 h-14 bg-emerald-50 rounded-none flex items-center justify-center text-emerald-600 mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <value.icon size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{value.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 md:px-8 pt-20">
        <div className="bg-[#004d40] rounded-none p-10 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-300 rounded-full blur-[100px]"></div>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight relative z-10">Fresh Groceries are <br /> Just a Click Away</h2>
          <p className="text-emerald-100 text-lg mb-10 max-w-xl mx-auto relative z-10 opacity-80">Join thousands of families who trust {storeInfo.name} for their daily nutrition.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            <Link to="/products" className="bg-emerald-500 hover:bg-emerald-400 text-white font-black px-10 py-5 rounded-none transition-all shadow-xl shadow-emerald-900/20 text-sm uppercase tracking-widest inline-block">
              Browse Products
            </Link>
            <a href={`mailto:${storeInfo.email}`} className="bg-white/10 hover:bg-white/20 text-white font-black px-10 py-5 rounded-none transition-all border border-white/20 text-sm uppercase tracking-widest inline-block">
              Contact Support
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
