
import React from 'react';
import { ShoppingCart, Heart } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, wishlist, toggleWishlist, user } = useStore();
  const isInWishlist = wishlist.includes(product.id);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to use wishlist");
      return;
    }
    toggleWishlist(product.id);
  };

  const primaryImage = product.images && product.images.length > 0 ? product.images[0] : '';
  
  // Refined Discount Logic: Selling price is product.price. Original price is product.originalPrice.
  // A discount ONLY exists if originalPrice is valid and greater than price.
  const isDiscounted = product.originalPrice !== undefined && product.originalPrice > product.price;
  const discountPercent = isDiscounted
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  return (
    <div className="group border border-gray-100 rounded-xl bg-white overflow-hidden hover:shadow-lg transition-all duration-300 relative flex flex-col">
      {/* Top Left: Heart Icon */}
      <button 
        onClick={handleToggleWishlist}
        className={`absolute top-4 left-4 p-1.5 transition-all z-10 hover:scale-110 active:scale-95 ${isInWishlist ? 'text-red-500' : 'text-emerald-500'}`}
      >
        <Heart size={18} fill={isInWishlist ? "currentColor" : "none"} />
      </button>

      {/* Top Right: Discount Badge - Only if there's an ACTUAL discount */}
      {(product.badge || (isDiscounted && discountPercent > 0)) && (
        <span className="absolute top-4 right-4 bg-[#00a651] text-white text-[10px] font-black px-2.5 py-1 rounded-full z-10 shadow-sm tracking-widest">
          {product.badge || `${discountPercent}%`}
        </span>
      )}

      {/* Image Area */}
      <Link to={`/product/${product.slug}`} className="h-52 p-4 flex items-center justify-center bg-transparent group-hover:bg-gray-50/50 transition-colors block">
        <img 
          src={primaryImage} 
          alt={product.name} 
          className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
        />
      </Link>

      {/* Content Area */}
      <div className="p-4 pt-0">
        {/* Price & Cart Row */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#00a651] text-base flex items-baseline gap-0.5">
              <span className="text-sm font-medium">৳</span>{product.price.toFixed(2)}
            </span>
            {/* PERMANENT FIX: Strikethrough price only renders if it is strictly greater than the current selling price */}
            {isDiscounted && (
              <span className="text-xs text-gray-400 line-through">
                ৳{product.originalPrice!.toFixed(2)}
              </span>
            )}
          </div>
          
          <button 
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-[#00a651] hover:bg-[#00a651] hover:text-white hover:border-[#00a651] transition-all"
          >
            <ShoppingCart size={16} />
          </button>
        </div>

        {/* Product Name Below Price */}
        <Link to={`/product/${product.slug}`} className="block">
          <h3 className="text-[13px] font-medium text-gray-700 leading-tight hover:text-[#00a651] transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
