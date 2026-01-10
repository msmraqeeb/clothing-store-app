
import React from 'react';
import { ShoppingCart, Heart } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { Link, useNavigate } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, wishlist, toggleWishlist, user } = useStore();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);
  const [imageOpacity, setImageOpacity] = React.useState(100);

  const isInWishlist = wishlist.includes(product.id);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to use wishlist");
      return;
    }
    toggleWishlist(product.id);
  };

  React.useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isHovered && product.images && product.images.length > 1) {
      interval = setInterval(() => {
        // Fade out
        setImageOpacity(0);

        setTimeout(() => {
          setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
          // Fade in
          setImageOpacity(100);
        }, 200); // 200ms fade out duration

      }, 1200); // Change every 1.2 seconds
    } else {
      setCurrentImageIndex(0);
      setImageOpacity(100);
    }

    return () => clearInterval(interval);
  }, [isHovered, product.images]);

  const currentImage = product.images && product.images.length > 0 ? product.images[currentImageIndex] : '';

  // Refined Discount Logic
  const isDiscounted = product.originalPrice !== undefined && product.originalPrice > product.price;
  const discountPercent = isDiscounted
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  return (
    <div
      className="group relative bg-white"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container with Overlay Actions */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 mb-0">
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          <img
            src={currentImage}
            alt={product.name}
            className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ease-in-out ${imageOpacity === 0 ? 'opacity-80 scale-100 blur-sm' : 'opacity-100'}`}
          />
        </Link>

        {/* Overlay Action Buttons */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 z-10">
          <button
            onClick={(e) => {
              e.preventDefault();
              if (product.variants && product.variants.length > 0) {
                navigate(`/product/${product.slug}`);
              } else {
                addToCart(product);
              }
            }}
            className="w-10 h-10 bg-white text-black shadow-md hover:bg-black hover:text-white transition-all flex items-center justify-center hover:scale-105"
            title="Add to Cart"
          >
            <ShoppingCart size={18} />
          </button>
          <button
            onClick={handleToggleWishlist}
            className={`w-10 h-10 bg-white shadow-md hover:bg-black hover:text-white transition-all flex items-center justify-center hover:scale-105 ${isInWishlist ? 'text-red-500' : 'text-black'}`}
            title="Add to Wishlist"
          >
            <Heart size={18} fill={isInWishlist ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* Content Area - White Box */}
      <div className="bg-white p-3 text-center space-y-1.5">
        <Link to={`/product/${product.slug}`} className="block">
          <h3 className="text-[14px] text-gray-800 font-medium leading-tight group-hover:text-black transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center justify-center gap-2">
          <span className="font-bold text-lg text-black">
            ৳{product.price.toLocaleString()}
          </span>

          {isDiscounted && (
            <>
              <span className="text-sm text-gray-400 line-through font-medium">
                ৳{product.originalPrice!.toLocaleString()}
              </span>
              <span className="bg-[#dcfce7] text-[#166534] text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase">
                {discountPercent}% OFF
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
