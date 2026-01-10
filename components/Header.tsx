import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, User, Heart, Menu, X, ChevronDown, LogOut } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const { cart, wishlist, user, signOut, openCart, storeInfo, products } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlist.length;

  // Filter products for live search
  const searchResults = React.useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return [];
    return products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);
  }, [searchQuery, products]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    // Also close search when route changes
    setIsSearchOpen(false);
  }, [location.pathname]);

  return (
    <header className="w-full font-sans relative z-50 bg-white border-b border-gray-100 sticky top-0">

      <div className="w-full px-6 md:px-12 h-14 md:h-20 flex items-center justify-between relative">

        {/* LEFT: Navigation */}
        <div className="flex items-center">
          {/* Mobile Hamburger */}
          <div className="flex md:hidden items-center mr-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-gray-800">
              <Menu size={24} strokeWidth={1.5} />
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-800">
            <Link to="/" className="hover:text-black transition-colors">Home</Link>
            <div className="relative group cursor-pointer flex items-center gap-1 hover:text-black transition-colors">
              <span>Festival</span>
              <ChevronDown size={14} />
              <div className="absolute top-full left-0 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-white border border-gray-100 shadow-xl rounded-none py-2 w-48 flex flex-col">
                  <Link to="/products?category=Eid" className="px-4 py-2 hover:bg-gray-50 text-gray-600 hover:text-black text-sm">Eid Collection</Link>
                  <Link to="/products?category=Puja" className="px-4 py-2 hover:bg-gray-50 text-gray-600 hover:text-black text-sm">Puja Special</Link>
                  <Link to="/products?category=Wedding" className="px-4 py-2 hover:bg-gray-50 text-gray-600 hover:text-black text-sm">Wedding Season</Link>
                </div>
              </div>
            </div>
            <Link to="/products?category=Men" className="hover:text-black transition-colors">Men</Link>
            <Link to="/products?category=Women" className="hover:text-black transition-colors">Women</Link>
          </nav>
        </div>

        {/* CENTER: Logo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link to="/" className="flex items-center justify-center">
            <img
              src="https://ytidovmyivmhocawgbda.supabase.co/storage/v1/object/public/product-images/vnv-logo.png"
              alt="VnV"
              className="h-8 md:h-12 w-auto object-contain"
            />
          </Link>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-5">
          {/* Desktop Search Trigger */}
          <div className="hidden md:block relative">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="flex p-1 hover:text-[#00a651] transition-colors"
            >
              <Search size={22} strokeWidth={1.5} />
            </button>

            {/* Desktop Search Popover */}
            {isSearchOpen && (
              <div className="absolute top-full right-0 mt-2 w-[400px] bg-white rounded-none shadow-2xl border border-gray-100 p-3 z-[60] animate-in fade-in slide-in-from-top-2 origin-top-right">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    className="w-full bg-gray-50 border-none rounded-none py-2.5 pl-4 pr-10 text-gray-700 outline-none focus:ring-0 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-10 text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleSearch()}
                    className="absolute right-2 text-gray-600 hover:text-[#00a651] p-1"
                  >
                    <Search size={18} />
                  </button>
                </div>

                {/* Live Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 border-t border-gray-100 pt-2 flex flex-col gap-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {searchResults.map(product => (
                      <div key={product.id} className="flex gap-3 p-2 hover:bg-gray-50 rounded-lg group cursor-pointer transition-colors">
                        <Link to={`/product/${product.slug}`} className="flex gap-3 flex-1" onClick={() => setIsSearchOpen(false)}>
                          <div className="w-12 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex flex-col justify-center">
                            <h4 className="text-sm text-gray-800 line-clamp-2 leading-tight group-hover:text-[#00a651] transition-colors">{product.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-bold text-sm text-gray-900">৳{product.price.toLocaleString()}</span>
                              {product.originalPrice && (
                                <span className="text-xs text-gray-400 line-through">৳{product.originalPrice.toLocaleString()}</span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-500 mt-0.5">{product.brand || 'Store Product'}</span>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}

                {searchQuery.length > 1 && searchResults.length === 0 && (
                  <div className="p-4 text-center text-gray-500 text-sm">No products found</div>
                )}
              </div>
            )}
          </div>

          {/* Wishlist */}
          <Link to="/my-account" className="flex items-center p-1 hover:text-red-500 transition-colors relative">
            <Heart size={22} strokeWidth={1.5} />
            <span className="ml-1 text-sm font-bold">{wishlistCount}</span>
          </Link>

          {/* Cart */}
          <button onClick={openCart} className="flex items-center p-1 hover:text-[#00a651] transition-colors relative">
            <ShoppingCart size={22} strokeWidth={1.5} />
            <span className="ml-1 text-sm font-bold">{cartCount}</span>
          </button>

          {/* User */}
          <Link to={user ? "/my-account" : "/login"} className="hidden md:flex p-1 hover:text-[#00a651] transition-colors">
            <User size={22} strokeWidth={1.5} />
          </Link>

          {/* Mobile User Icon (if needed here, but usually hidden in favor of bottom nav or just kept here) */}
          <div className="flex md:hidden">
            {/* Empty or keep User icon if consistent with mobile design. Previous design had logos on right for mobile. */}
            {/* Let's keep User icon as a fallback or extra access */}
            {/* Actually, user specified bottom nav has Account. The top right usually has nothing or just cart? */}
            {/* Let's keep it safe: Hide extra icons on mobile since we have bottom nav, but maybe keep cart?? */}
            {/* The bottom nav has Cart. So mobile header might just be Hamburger + Logo? */}
            {/* But current code has Hamburger Left, Logo Center. Right is empty? */}
            {/* Let's just keep the Desktop Actions hidden on mobile via `hidden md:flex` parent or individual items. */}
            {/* The parent `div className="flex items-center gap-5"` does NOT have hidden. */}
            {/* Individual items have `hidden md:block/flex`. Wishlist/Cart/User were visible. */}
            {/* Let's make the entire Right Actions block `hidden md:flex`? No, Wishlist/Cart might be useful? */}
            {/* User asked for bottom nav. Bottom nav has Cart, Search, Account. */}
            {/* So top header on mobile should probably be clean -> Just Logo + Hamburger? */}
            {/* Let's hide the Right Actions container on mobile entirely to be clean. */}
          </div>
        </div>
      </div>

      {/* RE-INSERTING MOBILE HEADER SECTION FOR PROPER DISPLAY separate from desktop if layout is too different */}
      <div className="md:hidden absolute top-0 left-0 w-full h-16 flex items-center justify-between px-4">
        {/* Duplicate Mobile Logic for safety if the above flex structure breaks mobile */}
        {/* Actually, let's just make sure the Desktop block above hides correctly on mobile. */}
        {/* The above block has `hidden md:flex` for the nav/icons. */}
        {/* But the container itself `w-full ... flex` is visible. */}
        {/* The Left Group contains the Mobile Hamburger (md:hidden). */}
        {/* The Right Group contains the Logo. */}
        {/* This results in: Left=Hamburger, Right=Logo. This is actually good for mobile too! */}
      </div>

      {/* Mobile Menu Drawer */}
      <div className={`fixed inset-0 z-[100] md:hidden transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
        <div className={`absolute top-0 left-0 w-[80%] max-w-[300px] h-full bg-white shadow-2xl transition-transform duration-300 ease-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-5 flex justify-between items-center border-b border-gray-100">
            <span className="text-xl font-bold tracking-widest">MENU</span>
            <button onClick={() => setIsMobileMenuOpen(false)}><X size={24} /></button>
          </div>

          <nav className="p-5 flex flex-col gap-4">
            <Link to="/" className="text-lg font-medium py-2 border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>

            {/* Mobile Festival Accordion (Simplified) */}
            <div className="py-2 border-b border-gray-50">
              <div className="font-medium text-lg mb-2 text-gray-800">Festival</div>
              <div className="pl-4 flex flex-col gap-2 text-gray-600">
                <Link to="/products?category=Eid" onClick={() => setIsMobileMenuOpen(false)}>Eid Collection</Link>
                <Link to="/products?category=Puja" onClick={() => setIsMobileMenuOpen(false)}>Puja Special</Link>
              </div>
            </div>

            <Link to="/products?category=Men" className="text-lg font-medium py-2 border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Men</Link>
            <Link to="/products?category=Women" className="text-lg font-medium py-2 border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>Women</Link>
            <Link to="/products" className="text-lg font-medium py-2 border-b border-gray-50" onClick={() => setIsMobileMenuOpen(false)}>All Products</Link>

            {/* Mobile Search */}
            <div className="mt-4">
              <form onSubmit={(e) => { handleSearch(e); setIsMobileMenuOpen(false); }} className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full bg-gray-100 rounded-none py-3 px-4 focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Search size={20} />
                </button>
              </form>
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[110] bg-white animate-in slide-in-from-bottom-5 duration-300 md:hidden">
          <div className="p-4 flex items-center gap-3 border-b border-gray-100">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full bg-gray-100 rounded-none py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-black"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            </div>
            <button onClick={() => setIsSearchOpen(false)} className="text-gray-500 p-1">
              <span className="text-sm font-semibold">Cancel</span>
            </button>
          </div>

          {/* Mobile Search Results */}
          <div className="p-4 overflow-y-auto h-[calc(100vh-80px)]">
            {searchResults.length > 0 ? (
              <div className="flex flex-col gap-3">
                {searchResults.map(product => (
                  <Link key={product.id} to={`/product/${product.slug}`} onClick={() => setIsSearchOpen(false)} className="flex gap-3 p-2 bg-gray-50 rounded-lg">
                    <img src={product.images[0]} alt={product.name} className="w-16 h-16 object-cover rounded" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 line-clamp-2">{product.name}</h4>
                      <div className="text-sm font-bold mt-1">৳{product.price}</div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              searchQuery.length > 1 && <div className="text-center text-gray-400 mt-10">No results found</div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 w-full bg-black z-[90] px-4 py-2 border-t border-gray-800 md:hidden pb-safe">
        <div className="flex items-center justify-between text-white relative">
          <Link to="/" className="flex flex-col items-center gap-0.5 opacity-80 hover:opacity-100 transition-opacity w-14">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            <span className="text-[8px] font-semibold tracking-wide mt-0.5">HOME</span>
          </Link>

          <button onClick={() => setIsMobileMenuOpen(true)} className="flex flex-col items-center gap-0.5 opacity-80 hover:opacity-100 transition-opacity w-14">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
            <span className="text-[8px] font-semibold tracking-wide mt-0.5">MENU</span>
          </button>

          <div className="relative -top-6">
            <div className="bg-white p-1 rounded-full shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] relative z-10">
              <button onClick={openCart} className="bg-black text-white w-12 h-12 rounded-full flex items-center justify-center relative shadow-lg">
                <ShoppingCart size={20} strokeWidth={2} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gray-600 text-white text-[9px] min-w-[16px] h-[16px] px-0.5 rounded-full flex items-center justify-center font-bold border border-black shadow-sm">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-white tracking-wider">CART</span>
          </div>

          <button onClick={() => setIsSearchOpen(true)} className="flex flex-col items-center gap-0.5 opacity-80 hover:opacity-100 transition-opacity w-14">
            <Search size={20} strokeWidth={1.5} />
            <span className="text-[8px] font-semibold tracking-wide mt-0.5">SEARCH</span>
          </button>

          <Link to={user ? "/my-account" : "/login"} className="flex flex-col items-center gap-0.5 opacity-80 hover:opacity-100 transition-opacity w-14">
            <User size={20} strokeWidth={1.5} />
            <span className="text-[8px] font-semibold tracking-wide mt-0.5">ACCOUNT</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
