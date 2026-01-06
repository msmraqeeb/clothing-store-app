import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Headphones, ShieldCheck, Award } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import BannerSlider from '../components/BannerSlider';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';

const Home: React.FC = () => {
  const { products, banners } = useStore();

  const traditionalProducts = useMemo(() => {
    return products.filter(p =>
      p.category === 'Traditional' ||
      p.category === 'Panjabi' ||
      p.name.toLowerCase().includes('panjabi') ||
      p.description.toLowerCase().includes('traditional')
    ).slice(0, 4);
  }, [products]);

  const fashionProducts = useMemo(() => {
    return products.filter(p =>
      !p.category.includes('Traditional') &&
      !p.category.includes('Panjabi')
    ).slice(0, 4);
  }, [products]);

  return (
    <div className="w-full bg-white pb-20">
      {/* Hero Section */}
      {/* Hero Section */}
      <section className="w-full relative bg-gray-100 overflow-hidden">
        {banners.filter(b => b.type === 'slider').length > 0 ? (
          <BannerSlider banners={banners.filter(b => b.type === 'slider').sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))} />
        ) : (
          /* Placeholder if no banners exist */
          <div className="w-full h-full relative">
            <img
              src="https://images.unsplash.com/photo-1596704017329-b472dfbb6142?auto=format&fit=crop&q=80&w=2000"
              alt="Available at Outlet and Online"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
              <div className="text-center bg-white/80 p-6 md:p-10 rounded-sm backdrop-blur-sm">
                <h1 className="text-3xl md:text-5xl font-bold mb-2 uppercase tracking-widest text-slate-800">Available</h1>
                <p className="text-sm md:text-xl uppercase tracking-widest text-slate-600">At Outlet & Online</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Category Tiles Section */}
      <section className="container mx-auto px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Women */}
          <div className="relative group h-[300px] md:h-[500px] overflow-hidden cursor-pointer">
            <img
              src="https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&q=80&w=800"
              alt="Women"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center pb-8">
              <h2 className="text-white text-3xl font-bold uppercase tracking-wide">Women</h2>
            </div>
          </div>

          {/* Traditional */}
          <div className="relative group h-[300px] md:h-[500px] overflow-hidden cursor-pointer">
            <img
              src="https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&q=80&w=800"
              alt="Traditional"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center pb-8">
              <h2 className="text-white text-3xl font-bold uppercase tracking-wide">Traditional</h2>
            </div>
          </div>

          {/* Panjabi */}
          <div className="relative group h-[300px] md:h-[500px] overflow-hidden cursor-pointer">
            <img
              src="https://images.unsplash.com/photo-1596704017329-b472dfbb6142?auto=format&fit=crop&q=80&w=800"
              alt="Panjabi"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center pb-8">
              <h2 className="text-white text-3xl font-bold uppercase tracking-wide">Panjabi</h2>
            </div>
          </div>
        </div>
      </section>

      {/* Featured / Lifestyle Mosaic Section (from the image where there are 2 large images and 2 smaller ones) */}
      <section className="container mx-auto px-4 md:px-8 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-[400px] md:h-[600px] relative overflow-hidden group">
            <img src="https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80&w=800" alt="Male Model" className="w-full h-full object-cover object-top" />
          </div>
          <div className="grid grid-rows-2 gap-4 h-[400px] md:h-[600px]">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative overflow-hidden group">
                <img src="https://images.unsplash.com/photo-1549488497-60aaa970b100?auto=format&fit=crop&q=80&w=600" alt="Couple" className="w-full h-full object-cover" />
              </div>
              <div className="relative overflow-hidden group">
                <img src="https://images.unsplash.com/photo-1601614769018-8f85f1c49b65?auto=format&fit=crop&q=80&w=600" alt="Woman" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="relative overflow-hidden group">
              <img src="https://images.unsplash.com/photo-1563178406-4cd468305c48?auto=format&fit=crop&q=80&w=800" alt="Group" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>


      {/* Traditional Products Section */}
      <section className="container mx-auto px-4 md:px-8 mb-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 uppercase tracking-widest leading-none">Traditional</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {traditionalProducts.map(product => (
            <ProductCard key={`trad-${product.id}`} product={product} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/products?category=Traditional" className="inline-block border-b-2 border-black pb-1 text-sm font-bold uppercase tracking-widest hover:text-[#00a651] hover:border-[#00a651] transition-colors">View All Analysis</Link>
        </div>
      </section>

      {/* Fashion Products Section */}
      <section className="container mx-auto px-4 md:px-8 mb-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 uppercase tracking-widest leading-none">Fashion</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {fashionProducts.map(product => (
            <ProductCard key={`fash-${product.id}`} product={product} />
          ))}
        </div>
      </section>

      {/* Features Bar */}
      <section className="container mx-auto px-4 md:px-8 mb-12">
        <div className="border-t border-gray-100 pt-12">
          <h3 className="text-center font-bold text-lg mb-8 uppercase tracking-wider">Features</h3>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { icon: Headphones, title: 'Online Support', subtitle: '24/7 Support' },
              { icon: ShieldCheck, title: 'Official Product', subtitle: '100% Original' },
              { icon: Truck, title: 'Fastest Delivery', subtitle: 'In 24 Hours' },
              { icon: Award, title: 'Secure Payment', subtitle: '100% Secure' },
            ].map((feat, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <div className="mb-3 p-3 rounded-full bg-gray-50 text-gray-800">
                  <feat.icon size={24} />
                </div>
                <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wide">{feat.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{feat.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

