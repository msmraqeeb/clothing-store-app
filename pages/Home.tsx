import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Headphones, ShieldCheck, Award } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import BannerSlider from '../components/BannerSlider';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';

const Home: React.FC = () => {
  const { products, banners } = useStore();



  const homeBanners = useMemo(() => {
    return banners
      .filter(b => b.type === 'home_banner')
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [banners]);

  return (
    <div className="w-full bg-white pb-20">
      {/* Hero Section */}
      {/* Hero Section */}
      <section className="w-full relative overflow-hidden">
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

      {/* Home Banners (First 3) */}
      {homeBanners.length > 0 && (
        <section className="w-full px-2 md:px-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
            {homeBanners.slice(0, 3).map((banner) => (
              <Link to={banner.link || '#'} key={banner.id} className="relative group overflow-hidden block">
                <img
                  src={banner.image_url}
                  alt={banner.title || 'Banner'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 aspect-[4/3] md:aspect-auto"
                />
                {(banner.title || banner.subtitle) && (
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-colors duration-500 flex flex-col items-center justify-center p-4">
                    {banner.title && (
                      <h3 className="text-3xl md:text-5xl font-black uppercase tracking-wider text-white drop-shadow-lg text-center leading-tight">
                        {banner.title}
                      </h3>
                    )}
                    {banner.subtitle && (
                      <p className="text-sm md:text-lg font-bold uppercase tracking-widest text-white/90 mt-2 drop-shadow-md">
                        {banner.subtitle}
                      </p>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Mosaic Banners (4, 5, 6, 7) */}
      {homeBanners.length >= 4 && (
        <section className="w-full px-2 md:px-4 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 h-auto lg:h-[800px]">
            {/* Left Column: Banner 4 */}
            {homeBanners[3] && (
              <Link to={homeBanners[3].link || '#'} className="relative group overflow-hidden h-[500px] lg:h-full block">
                <img src={homeBanners[3].image_url} alt={homeBanners[3].title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                {(homeBanners[3].title || homeBanners[3].subtitle) && (
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-colors duration-500 flex flex-col items-center justify-center p-4">
                    {homeBanners[3].title && <h3 className="text-3xl lg:text-5xl font-black uppercase text-white drop-shadow-lg text-center">{homeBanners[3].title}</h3>}
                    {homeBanners[3].subtitle && <p className="text-sm lg:text-xl font-bold uppercase text-white/90 mt-2 drop-shadow-md">{homeBanners[3].subtitle}</p>}
                  </div>
                )}
              </Link>
            )}

            {/* Right Column */}
            <div className="flex flex-col gap-2 h-auto lg:h-full">
              {/* Top Row: Banner 5 & 6 */}
              <div className="grid grid-cols-2 gap-2 h-[250px] lg:h-1/2">
                {[homeBanners[4], homeBanners[5]].map((banner, idx) => (
                  banner && (
                    <Link to={banner.link || '#'} key={banner.id} className="relative group overflow-hidden block h-full">
                      <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      {(banner.title || banner.subtitle) && (
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-colors duration-500 flex flex-col items-center justify-center p-4">
                          {banner.title && <h3 className="text-xl lg:text-3xl font-black uppercase text-white drop-shadow-lg text-center">{banner.title}</h3>}
                          {banner.subtitle && <p className="text-xs lg:text-sm font-bold uppercase text-white/90 mt-2 drop-shadow-md">{banner.subtitle}</p>}
                        </div>
                      )}
                    </Link>
                  )
                ))}
              </div>
              {/* Bottom Row: Banner 7 */}
              <div className="h-[250px] lg:h-1/2">
                {homeBanners[6] && (
                  <Link to={homeBanners[6].link || '#'} className="relative group overflow-hidden block h-full">
                    <img src={homeBanners[6].image_url} alt={homeBanners[6].title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    {(homeBanners[6].title || homeBanners[6].subtitle) && (
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-colors duration-500 flex flex-col items-center justify-center p-4">
                        {homeBanners[6].title && <h3 className="text-2xl lg:text-4xl font-black uppercase text-white drop-shadow-lg text-center">{homeBanners[6].title}</h3>}
                        {homeBanners[6].subtitle && <p className="text-sm lg:text-lg font-bold uppercase text-white/90 mt-2 drop-shadow-md">{homeBanners[6].subtitle}</p>}
                      </div>
                    )}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
