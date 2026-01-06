
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { supabase } from '../lib/supabase';
import {
  Package, ShoppingBag, Plus, Trash2, X, ShieldCheck, Pencil,
  Ticket, Eye, Truck, RefreshCw, Layers, Zap, Users as UsersIcon,
  Globe, PlusCircle, Image as ImageIcon, Save, AlertTriangle,
  ChevronDown, MessageSquare, Star, ChevronRight, Minus,
  Settings as SettingsIcon, Search, Edit3, Check, Database, Copy, Printer, Calendar, BarChart3, FileText, LayoutTemplate, Upload, BookOpen
} from 'lucide-react';
import { Product, Category, Order, Variant, ShippingSettings, Brand, Coupon, CartItem, StoreInfo, Page, HomeSection, BlogPost } from '../types';
import { PageBuilder } from '../components/PageBuilder';
import RichTextEditor from '../components/RichTextEditor';
import { DISTRICT_AREA_DATA } from '../constants';

const Admin: React.FC = () => {
  const {
    products, orders, coupons, categories, attributes, users, brands, shippingSettings, reviews, pages,
    addProduct, updateProduct, deleteProduct,
    addCategory, updateCategory, deleteCategory,
    addCoupon, updateCoupon, deleteCoupon,
    addAttribute, updateAttribute, deleteAttribute,
    updateOrderStatus, addBrand, updateBrand, deleteBrand, updateUserRole,
    updateShippingSettings, refreshAllData, updateOrder, deleteReview, replyToReview,
    storeInfo: currentStoreInfo, updateStoreInfo,
    addPage, updatePage, deletePage,
    banners, addBanner, deleteBanner,
    homeSections, addHomeSection, updateHomeSection, deleteHomeSection,
    blogPosts, addBlogPost, updateBlogPost, deleteBlogPost
  } = useStore();

  const [adminTab, setAdminTabState] = useState<string>('products');
  const [isSyncing, setIsSyncing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const handleImageError = (id: string) => setBrokenImages(prev => ({ ...prev, [id]: true }));

  // Forms Visibility & Data
  const [editingItem, setEditingItem] = useState<{ type: string; data: any } | null>(null);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [editingOrderData, setEditingOrderData] = useState<Order | null>(null);

  // Product Selector for Order Editing
  const [orderProductSearch, setOrderProductSearch] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Form States
  const [prodForm, setProdForm] = useState({
    name: '', basePrice: '', salePrice: '', category: '', description: '', shortDescription: '', images: [] as string[],
    unit: '', sku: '', brand: '', isFeatured: false, variants: [] as Variant[], tempAttributes: [] as { name: string, options: string[] }[]
  });

  const [catForm, setCatForm] = useState({ name: '', parentId: '' as string | null, image: '' });
  const [brandForm, setBrandForm] = useState({ name: '', slug: '', logo_url: '' });

  // Global Attributes Form State
  const [attrForm, setAttrForm] = useState({ name: '' });
  const [attrValuesInput, setAttrValuesInput] = useState('');

  const [couponForm, setCouponForm] = useState<Omit<Coupon, 'id' | 'createdAt'>>({
    code: '', discountType: 'Fixed', discountValue: 0, minimumSpend: 0, expiryDate: '', status: 'Active', autoApply: false
  });
  const [shipForm, setShipForm] = useState<ShippingSettings>(shippingSettings);
  const [storeForm, setStoreForm] = useState<StoreInfo>({ name: '', logo_url: '', address: '', phone: '', email: '', socials: {} });
  const [pageForm, setPageForm] = useState<Omit<Page, 'id' | 'createdAt'>>({ title: '', slug: '', content: '', isPublished: true });
  const [bannerForm, setBannerForm] = useState<{ type: 'slider' | 'right_top' | 'right_bottom'; title: string; subtitle: string; image_url: string; link: string; sort_order: number; is_active: boolean }>({
    type: 'slider', title: '', subtitle: '', image_url: '', link: '', sort_order: 0, is_active: true
  });
  const [sectionForm, setSectionForm] = useState<Omit<HomeSection, 'id'>>({
    title: '', type: 'slider', filterType: 'all', sortOrder: 0, isActive: true,
    banner: { title: '', description: '', imageUrl: '', buttonText: 'Shop Now', link: '/products' }
  });
  const [blogForm, setBlogForm] = useState<Omit<BlogPost, 'id' | 'date'>>({
    title: '', excerpt: '', content: '', author: '', imageUrl: '', slug: '', tags: []
  });

  // Update forms when data is loaded
  useEffect(() => {
    setShipForm(shippingSettings);
  }, [shippingSettings]);

  useEffect(() => {
    setStoreForm(currentStoreInfo);
  }, [currentStoreInfo]);

  // Report States
  const [reportStartDate, setReportStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [reportEndDate, setReportEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Report Calculations
  const reportData = useMemo(() => {
    const start = new Date(reportStartDate);
    const end = new Date(reportEndDate);
    end.setHours(23, 59, 59, 999);

    const filteredOrders = orders.filter(o => {
      const d = new Date(o.date);
      return d >= start && d <= end && o.status !== 'Cancelled';
    });

    const filteredUsers = users.filter(u => {
      const d = new Date(u.created_at);
      return d >= start && d <= end;
    });

    // 1. Sales by Date
    const salesByDate: Record<string, number> = {};
    filteredOrders.forEach(o => {
      const dateKey = new Date(o.date).toLocaleDateString();
      salesByDate[dateKey] = (salesByDate[dateKey] || 0) + o.total;
    });

    // 2. Sales by Product
    const salesByProduct: Record<string, { name: string, quantity: number, revenue: number }> = {};
    filteredOrders.forEach(o => {
      o.items.forEach(item => {
        if (!salesByProduct[item.id]) {
          salesByProduct[item.id] = { name: item.name, quantity: 0, revenue: 0 };
        }
        salesByProduct[item.id].quantity += item.quantity;
        salesByProduct[item.id].revenue += item.price * item.quantity;
      });
    });

    // 3. Sales by Category
    const salesByCategory: Record<string, number> = {};
    filteredOrders.forEach(o => {
      o.items.forEach(item => {
        const cat = item.category || 'Uncategorized';
        salesByCategory[cat] = (salesByCategory[cat] || 0) + (item.price * item.quantity);
      });
    });

    // 4. Coupons by Date
    const couponsByDate: Record<string, number> = {};
    filteredOrders.forEach(o => {
      if (o.coupon_code) {
        const dateKey = new Date(o.date).toLocaleDateString();
        couponsByDate[dateKey] = (couponsByDate[dateKey] || 0) + 1;
      }
    });

    // 5. Customer Report (Sales by Customer)
    const customerStats: Record<string, { name: string, email: string, orders: number, spent: number }> = {};
    filteredOrders.forEach(o => {
      const email = o.customerEmail || o.customerPhone || 'Unknown';
      if (!customerStats[email]) {
        customerStats[email] = { name: o.customerName, email: o.customerEmail || o.customerPhone || 'N/A', orders: 0, spent: 0 };
      }
      customerStats[email].orders += 1;
      customerStats[email].spent += o.total;
    });

    return {
      salesByDate,
      salesByProduct: Object.values(salesByProduct).sort((a, b) => b.revenue - a.revenue),
      salesByCategory,
      couponsByDate,
      customerReport: Object.values(customerStats).sort((a, b) => b.spent - a.spent),
      newCustomersCount: filteredUsers.length
    };
  }, [orders, coupons, users, reportStartDate, reportEndDate]);

  const [showAttrForm, setShowAttrForm] = useState(false);
  const [draftAttr, setDraftAttr] = useState({ name: '', options: [] as string[], currentOption: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSupportImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStoreForm(prev => ({
          ...prev,
          floatingWidget: { ...(prev.floatingWidget || {}), supportImage: reader.result as string }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const SQL_SCHEMA = `-- SMart Grocery Super Admin Schema (V7)
-- This script FIXES RLS "violate policy" errors for orders, wishlist, and addresses.
-- SAFE to run multiple times. Data stays intact.

-- 1. Table Consistency Check
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.categories (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  image_url TEXT,
  parent_id BIGINT REFERENCES public.categories(id),
  item_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.products (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  category TEXT,
  brand TEXT,
  unit TEXT,
  sku TEXT,
  images TEXT[],
  image_url TEXT,
  short_description TEXT,
  description TEXT,
  badge TEXT,
  is_featured BOOLEAN DEFAULT false,
  variants JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.orders (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  customer_district TEXT,
  customer_area TEXT,
  subtotal NUMERIC DEFAULT 0,
  shipping_cost NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Pending',
  items JSONB DEFAULT '[]'::jsonb,
  coupon_code TEXT,
  user_id UUID REFERENCES auth.users(id),
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB
);

-- 2. Storage Bucket Setup (Idempotent)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies (Adjust for production security)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'product-images' );

DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'product-images' AND auth.role() = 'authenticated' );


CREATE TABLE IF NOT EXISTS public.banners (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('slider', 'right_top', 'right_bottom')),
  title TEXT,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Access (Everyone can see banners)
DROP POLICY IF EXISTS "Public Read Banners" ON public.banners;
CREATE POLICY "Public Read Banners" ON public.banners FOR SELECT USING (true);

-- 2. Super Admin Access (JWT Email Check - No Table Access Required)
DROP POLICY IF EXISTS "Allow All For Admin" ON public.banners;
CREATE POLICY "Allow All For Admin" ON public.banners 
FOR ALL 
USING ((auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com') 
WITH CHECK ((auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com');

-- 3. General Admin Access (Role Based)
DROP POLICY IF EXISTS "Admin All Banners" ON public.banners;
CREATE POLICY "Admin All Banners" ON public.banners 
FOR ALL
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')) 
WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Ensure database role matches
UPDATE public.profiles SET role = 'admin' WHERE email = 'msmraqeeb@gmail.com';

CREATE TABLE IF NOT EXISTS public.wishlist (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.addresses (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  address_line TEXT,
  district TEXT,
  area TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Reset RLS and Policies for clean application
DO $$ 
DECLARE 
  t text;
BEGIN
  FOR t IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE 'ALTER TABLE public.' || t || ' ENABLE ROW LEVEL SECURITY';
  END LOOP;
END $$;

DO $$ 
DECLARE 
  pol RECORD;
BEGIN
  FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.' || pol.tablename;
  END LOOP;
END $$;

-- 3. APPLY BULLETPROOF ADMIN POLICIES
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated
USING ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' )
WITH CHECK ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' );
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);

CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated
USING ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' )
WITH CHECK ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' );
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);

CREATE POLICY "Admins manage orders" ON public.orders FOR ALL TO authenticated
USING ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' )
WITH CHECK ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' );
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT TO authenticated
USING ( auth.uid() = user_id );
CREATE POLICY "Anyone can insert orders" ON public.orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Users manage own wishlist" ON public.wishlist FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.brands (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage brands" ON public.brands FOR ALL TO authenticated
USING ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' )
WITH CHECK ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' );
CREATE POLICY "Public read brands" ON public.brands FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.attributes (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  values JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.attributes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage attributes" ON public.attributes FOR ALL TO authenticated
USING ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' )
WITH CHECK ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' );
CREATE POLICY "Public read attributes" ON public.attributes FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.coupons (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL,
  discount_value NUMERIC NOT NULL,
  minimum_spend NUMERIC DEFAULT 0,
  expiry_date DATE NOT NULL,
  status TEXT DEFAULT 'Active',
  auto_apply BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL TO authenticated
USING ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' )
WITH CHECK ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' );
CREATE POLICY "Public read coupons" ON public.coupons FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.reviews (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  product_id BIGINT REFERENCES public.products(id) ON DELETE CASCADE,
  product_name TEXT,
  author_name TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  reply TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage reviews" ON public.reviews FOR ALL TO authenticated
USING ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' )
WITH CHECK ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' );
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert reviews" ON public.reviews FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage settings" ON public.settings FOR ALL TO authenticated
USING ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' )
WITH CHECK ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' );
CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);

CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT USING ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' );

UPDATE public.profiles SET role = 'admin' WHERE email = 'msmraqeeb@gmail.com';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN NEW.email = 'msmraqeeb@gmail.com' THEN 'admin' ELSE 'customer' END
  )
  ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TABLE IF NOT EXISTS public.pages (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage pages" ON public.pages FOR ALL TO authenticated
USING ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' )
WITH CHECK ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' );
CREATE POLICY "Public read pages" ON public.pages FOR SELECT USING (is_published = true);

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT,
  author TEXT,
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage blog" ON public.blog_posts FOR ALL TO authenticated
USING ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' )
WITH CHECK ( public.get_my_role() = 'admin' OR (auth.jwt() ->> 'email') = 'msmraqeeb@gmail.com' );
CREATE POLICY "Public read blog" ON public.blog_posts FOR SELECT USING (true);`;

  useEffect(() => {
    if (replyingTo) {
      const review = reviews.find(r => r.id === replyingTo);
      setReplyText(review?.reply || '');
    }
  }, [replyingTo, reviews]);

  useEffect(() => {
    setShipForm(shippingSettings);
  }, [shippingSettings]);

  const hierarchicalCategories = useMemo(() => {
    const buildHierarchy = (parentId: string | null = null, level: number = 0): (Category & { level: number })[] => {
      let result: (Category & { level: number })[] = [];
      categories.filter(c => c.parentId === parentId).forEach(child => {
        result.push({ ...child, level });
        result = [...result, ...buildHierarchy(child.id, level + 1)];
      });
      return result;
    };
    return buildHierarchy(null);
  }, [categories]);

  // Pricing Logic Helper
  const getProductDisplayPrice = (p: Product) => {
    const hasSale = p.originalPrice !== undefined && p.originalPrice > p.price;
    return {
      mrp: hasSale ? p.originalPrice : p.price,
      sale: hasSale ? p.price : null
    };
  };

  const handleAddOption = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!draftAttr.currentOption.trim()) return;
    setDraftAttr(prev => ({
      ...prev,
      options: [...prev.options, prev.currentOption.trim()],
      currentOption: ''
    }));
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SQL_SCHEMA);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  const removeTempAttribute = (index: number) => {
    setProdForm(prev => ({
      ...prev,
      tempAttributes: prev.tempAttributes.filter((_, i) => i !== index)
    }));
  };

  const commitDraftAttribute = () => {
    if (!draftAttr.name.trim() || draftAttr.options.length === 0) {
      alert("Please enter an attribute name and at least one option.");
      return;
    }
    setProdForm(prev => ({
      ...prev,
      tempAttributes: [...prev.tempAttributes, { name: draftAttr.name, options: draftAttr.options }]
    }));
    setShowAttrForm(false);
    setDraftAttr({ name: '', options: [], currentOption: '' });
  };

  const handleGlobalAttrSelect = (attrId: string) => {
    const selected = attributes.find(a => a.id === attrId);
    if (selected) {
      setDraftAttr({
        name: selected.name,
        options: selected.values.map(v => v.value),
        currentOption: ''
      });
    }
  };

  const generateVariants = () => {
    const selectedAttrs = prodForm.tempAttributes.filter(a => a.options.length > 0);
    if (selectedAttrs.length === 0) {
      alert("Add some attributes first!");
      return;
    }

    const cartesian = (...args: any[][]) => args.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
    const combinations = selectedAttrs.length === 1
      ? selectedAttrs[0].options.map(opt => [opt])
      : cartesian(...selectedAttrs.map(a => a.options));

    const pBase = parseFloat(String(prodForm.basePrice)) || 0;
    const pSale = parseFloat(String(prodForm.salePrice)) || 0;
    const isDiscounted = pSale > 0 && pSale < pBase;

    setProdForm(prev => ({
      ...prev,
      variants: combinations.map((combo: string[], idx: number) => {
        const attrValues: Record<string, string> = {};
        selectedAttrs.forEach((attr, i) => { attrValues[attr.name] = combo[i]; });
        return {
          id: Math.random().toString(36).substr(2, 9),
          attributeValues: attrValues,
          price: isDiscounted ? pSale : pBase,
          originalPrice: isDiscounted ? pBase : undefined,
          sku: `${prodForm.sku || 'PROD'}-${idx}`,
          stock: 100,
          image: prodForm.images[0] || ''
        };
      })
    }));
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pBase = parseFloat(String(prodForm.basePrice)) || 0;
    const pSale = parseFloat(String(prodForm.salePrice)) || 0;

    let finalPrice = pBase;
    let finalOriginal = undefined;
    if (pSale > 0 && pSale < pBase) {
      finalPrice = pSale;
      finalOriginal = pBase;
    }

    const data: Omit<Product, 'id'> = {
      name: prodForm.name,
      price: finalPrice,
      originalPrice: finalOriginal,
      category: prodForm.category,
      description: prodForm.description,
      shortDescription: prodForm.shortDescription,
      images: prodForm.images,
      unit: prodForm.unit,
      sku: prodForm.sku,
      brand: prodForm.brand,
      isFeatured: prodForm.isFeatured,
      variants: prodForm.variants,
      slug: prodForm.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
    };

    try {
      if (editingItem?.type === 'product') await updateProduct(editingItem.data.id, data);
      else await addProduct(data);
      closeForms();
    } catch (err: any) { alert(err.message); }
  };

  const startEditProduct = (p: Product) => {
    const hasSale = p.originalPrice !== undefined && p.originalPrice > p.price;
    const reconstructedAttrs: { name: string, options: string[] }[] = [];
    if (p.variants && p.variants.length > 0) {
      const attrMap: Record<string, Set<string>> = {};
      p.variants.forEach(v => {
        Object.entries(v.attributeValues).forEach(([name, val]) => {
          if (!attrMap[name]) attrMap[name] = new Set();
          attrMap[name].add(val);
        });
      });
      Object.entries(attrMap).forEach(([name, vals]) => {
        reconstructedAttrs.push({ name, options: Array.from(vals) });
      });
    }

    setProdForm({
      name: p.name,
      basePrice: (hasSale ? p.originalPrice : p.price)?.toString() || '0',
      salePrice: (hasSale ? p.price.toString() : ''),
      category: p.category,
      description: p.description,
      shortDescription: p.shortDescription || '',
      images: p.images || [],
      unit: p.unit || '',
      sku: p.sku || '',
      brand: p.brand || '',
      isFeatured: p.isFeatured || false,
      variants: p.variants || [],
      tempAttributes: reconstructedAttrs
    });
    setEditingItem({ type: 'product', data: p });
    setIsAdding(null);
  };

  const handlePageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = pageForm.slug.toLowerCase().trim().replace(/[\s_-]+/g, '-');
    try {
      if (editingItem?.type === 'page') await updatePage(editingItem.data.id, { ...pageForm, slug });
      else await addPage({ ...pageForm, slug });
      closeForms();
    } catch (err: any) { alert(err.message); }
  };

  const startEditPage = (p: Page) => {
    setPageForm({ title: p.title, slug: p.slug, content: p.content, isPublished: p.isPublished });
    setEditingItem({ type: 'page', data: p });
    setIsAdding(null);
  };

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addBanner(bannerForm);
      setBannerForm({ type: 'slider', title: '', subtitle: '', image_url: '', link: '', sort_order: 0, is_active: true });
      setIsAdding(null);
    } catch (err: any) { alert(err.message); }
  };

  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem?.type === 'section') {
        const updatedSection = { ...sectionForm, id: editingItem.data.id } as HomeSection;
        await updateHomeSection(editingItem.data.id, updatedSection);
      } else {
        const newSection = { ...sectionForm, id: `section-${Date.now()}` } as HomeSection;
        await addHomeSection(newSection);
      }
      closeForms();
    } catch (err: any) { alert(err.message); }
  };

  const handleSectionBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
      setSectionForm({ ...sectionForm, banner: { ...sectionForm.banner!, imageUrl: data.publicUrl } });
    } catch (error: any) {
      alert('Error uploading image: ' + error.message);
    }
  };

  const startEditSection = (s: HomeSection) => {
    setSectionForm({
      title: s.title, type: s.type, filterType: s.filterType, filterValue: s.filterValue, sortOrder: s.sortOrder, isActive: s.isActive,
      banner: s.banner
    });
    setEditingItem({ type: 'section', data: s });
    setIsAdding(null);
  };

  const handleBlogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = blogForm.slug.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
    try {
      if (editingItem?.type === 'blog') await updateBlogPost(editingItem.data.id, { ...blogForm, slug });
      else await addBlogPost({ ...blogForm, slug });
      closeForms();
    } catch (err: any) { alert(err.message); }
  };

  const handleBlogImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `blog-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
      setBlogForm(prev => ({ ...prev, imageUrl: data.publicUrl }));
    } catch (error: any) {
      alert('Error uploading image: ' + error.message);
    }
  };

  const startEditBlog = (p: BlogPost) => {
    setBlogForm({
      title: p.title, excerpt: p.excerpt, content: p.content, author: p.author, imageUrl: p.imageUrl, slug: p.slug, tags: p.tags
    });
    setEditingItem({ type: 'blog', data: p });
    setIsAdding(null);
  };

  const closeForms = () => {
    setEditingItem(null); setIsAdding(null); setViewingOrder(null); setReplyingTo(null);
    setIsEditingOrder(false); setEditingOrderData(null);
    setProdForm({ name: '', basePrice: '', salePrice: '', category: '', description: '', shortDescription: '', images: [], unit: '', sku: '', brand: '', isFeatured: false, variants: [], tempAttributes: [] });
    setCatForm({ name: '', parentId: null, image: '' });
    setBrandForm({ name: '', slug: '', logo_url: '' });
    setAttrForm({ name: '' });
    setAttrValuesInput('');
    setCouponForm({ code: '', discountType: 'Fixed', discountValue: 0, minimumSpend: 0, expiryDate: '', status: 'Active', autoApply: false });

    setCouponForm({ code: '', discountType: 'Fixed', discountValue: 0, minimumSpend: 0, expiryDate: '', status: 'Active', autoApply: false });
    setCouponForm({ code: '', discountType: 'Fixed', discountValue: 0, minimumSpend: 0, expiryDate: '', status: 'Active', autoApply: false });
    setSectionForm({ title: '', type: 'slider', filterType: 'all', sortOrder: 0, isActive: true, banner: { title: '', description: '', imageUrl: '', buttonText: 'Shop Now', link: '/products' } });
    setBlogForm({ title: '', excerpt: '', content: '', author: '', imageUrl: '', slug: '', tags: [] });

    setPageForm({ title: '', slug: '', content: '', isPublished: true });
    setShowAttrForm(false);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = catForm.name.toLowerCase().trim().replace(/[\s_-]+/g, '-');
    try {
      if (editingItem?.type === 'category') await updateCategory(editingItem.data.id, { ...catForm, slug });
      else await addCategory({ ...catForm, slug });
      closeForms();
    } catch (err: any) { alert(err.message); }
  };

  const handleBrandLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `brand-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
      setBrandForm(prev => ({ ...prev, logo_url: data.publicUrl }));
    } catch (error: any) {
      alert('Error uploading logo: ' + error.message);
    }
  };

  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = (brandForm.slug || brandForm.name).toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
    try {
      if (editingItem?.type === 'brand') await updateBrand(editingItem.data.id, { ...brandForm, slug });
      else await addBrand({ ...brandForm, slug });
      closeForms();
    } catch (err: any) { alert(err.message); }
  };

  const handleAttributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const valuesArray = attrValuesInput.split(',').map(v => v.trim()).filter(v => v !== '');
      const valuesObjects = valuesArray.map(v => ({ id: Math.random().toString(), value: v }));
      if (editingItem?.type === 'attribute') await updateAttribute(editingItem.data.id, attrForm.name, valuesObjects);
      else await addAttribute(attrForm.name, valuesObjects);
      closeForms();
    } catch (err: any) { alert(err.message); }
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem?.type === 'coupon') await updateCoupon(editingItem.data.id, couponForm);
      else await addCoupon(couponForm);
      closeForms();
    } catch (err: any) { alert(err.message); }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingTo) return;
    try {
      await replyToReview(replyingTo, replyText);
      setReplyingTo(null);
      setReplyText('');
    } catch (err: any) { alert(err.message); }
  };

  // Order Editing Handlers
  const startEditingOrder = () => {
    if (!viewingOrder) return;
    setEditingOrderData({ ...viewingOrder });
    setIsEditingOrder(true);
  };

  const recalculateOrderTotals = (updatedData: Order) => {
    const subtotal = updatedData.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    let discount = 0;
    if (updatedData.coupon_code) {
      const coupon = coupons.find(c => c.code === updatedData.coupon_code);
      if (coupon) {
        if (coupon.discountType === 'Fixed') discount = coupon.discountValue;
        else discount = (subtotal * coupon.discountValue) / 100;
      }
    }
    const total = subtotal + updatedData.shippingCost - discount;
    return { ...updatedData, subtotal, total, discount };
  };

  const updateOrderItems = (newItems: CartItem[]) => {
    if (!editingOrderData) return;
    const updated = recalculateOrderTotals({ ...editingOrderData, items: newItems });
    setEditingOrderData(updated);
  };

  const removeOrderItem = (itemIdx: number) => {
    if (!editingOrderData) return;
    const newItems = editingOrderData.items.filter((_, i) => i !== itemIdx);
    updateOrderItems(newItems);
  };

  const changeOrderItemQty = (itemIdx: number, delta: number) => {
    if (!editingOrderData) return;
    const newItems = [...editingOrderData.items];
    newItems[itemIdx].quantity = Math.max(1, newItems[itemIdx].quantity + delta);
    updateOrderItems(newItems);
  };

  const changeOrderShipping = (newCost: number) => {
    if (!editingOrderData) return;
    const updated = recalculateOrderTotals({ ...editingOrderData, shippingCost: newCost });
    setEditingOrderData(updated);
  };

  const updateCustomerInfo = (field: keyof Order, value: any) => {
    if (!editingOrderData) return;
    let newData = { ...editingOrderData, [field]: value };
    if (field === 'customerDistrict') newData.customerArea = '';
    setEditingOrderData(newData);
  };

  const addProductToOrder = (product: Product, variant?: Variant) => {
    if (!editingOrderData) return;
    const variantId = variant?.id;
    const existingIdx = editingOrderData.items.findIndex(item =>
      item.id === product.id && item.selectedVariantId === variantId
    );
    if (existingIdx > -1) {
      changeOrderItemQty(existingIdx, 1);
    } else {
      const newItem: CartItem = {
        ...product,
        quantity: 1,
        selectedVariantId: variantId,
        selectedVariantName: variant ? Object.values(variant.attributeValues).join(' / ') : undefined,
        selectedVariantImage: variant?.image || product.images?.[0] || '',
        price: variant ? variant.price : product.price
      };
      updateOrderItems([...editingOrderData.items, newItem]);
    }
    setShowProductPicker(false);
    setOrderProductSearch('');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `store-logo-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
      setStoreForm(prev => ({ ...prev, logo_url: data.publicUrl }));
    } catch (error: any) {
      alert(`Error uploading logo: ${error.message}`);
    }
  };

  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `banner-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
      setBannerForm(prev => ({ ...prev, image_url: data.publicUrl }));
    } catch (error: any) { alert(`Error uploading image: ${error.message}`); }
  };

  const saveOrderEdits = async () => {
    if (!editingOrderData) return;
    try {
      await updateOrder(editingOrderData.id, editingOrderData);
      setViewingOrder(editingOrderData);
      setIsEditingOrder(false);
      setEditingOrderData(null);
    } catch (err: any) { alert("Failed to update order: " + err.message); }
  };

  const orderSearchFilteredProducts = useMemo(() => {
    if (!orderProductSearch.trim()) return [];
    return products.filter(p =>
      p.name.toLowerCase().includes(orderProductSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(orderProductSearch.toLowerCase())
    ).slice(0, 5);
  }, [products, orderProductSearch]);

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Cancelled': return 'bg-red-50 text-red-600 border-red-100';
      case 'Processing': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  const printInvoice = (order: Order) => {
    const invoiceWindow = window.open('', '_blank');
    if (!invoiceWindow) return alert("Please allow popups to print invoices");

    const html = `
      <html>
        <head>
          <title>Invoice #${order.id}</title>
          <style>
            body { font-family: 'Helvetica', sans-serif; color: #333; padding: 40px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .company h1 { margin: 0; color: #00a651; }
            .company p { margin: 5px 0 0; color: #666; }
            .invoice-details { text-align: right; }
            .invoice-details h2 { margin: 0 0 10px; color: #333; }
            .invoice-details p { margin: 2px 0; color: #666; }
            .bill-to { margin-bottom: 30px; background: #f9f9f9; padding: 20px; border-radius: 10px; }
            .bill-to h3 { margin: 0 0 10px; color: #00a651; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
            .bill-to p { margin: 2px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; border-bottom: 2px solid #eee; padding: 15px 10px; font-size: 12px; text-transform: uppercase; color: #888; }
            td { padding: 15px 10px; border-bottom: 1px solid #eee; }
            .totals { width: 300px; margin-left: auto; }
            .row { display: flex; justify-content: space-between; padding: 5px 0; }
            .total-row { font-weight: bold; border-top: 2px solid #eee; padding-top: 15px; margin-top: 10px; font-size: 1.2em; color: #00a651; }
            @media print { body { padding: 0; } .bill-to { background: none; padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company">
              <h1>SMart Grocery</h1>
              <p>Dhaka, Bangladesh</p>
            </div>
            <div class="invoice-details">
              <h2>INVOICE</h2>
              <p>Order #${order.id}</p>
              <p>${new Date(order.date).toLocaleDateString()}</p>
            </div>
          </div>

          <div class="bill-to">
            <h3>Bill To</h3>
            <p><strong>${order.customerName}</strong></p>
            <p>${[order.customerAddress, order.customerArea, order.customerDistrict].filter(Boolean).join(', ')}</p>
            <p>${order.customerPhone}</p>
            <p>${order.customerEmail || ''}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>
                    ${item.name}
                    ${item.selectedVariantName ? `<br><small style="color: #888">${item.selectedVariantName}</small>` : ''}
                  </td>
                  <td>${item.quantity}</td>
                  <td>৳${item.price.toFixed(2)}</td>
                  <td>৳${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="row"><span>Subtotal:</span> <span>৳${order.subtotal.toFixed(2)}</span></div>
            <div class="row"><span>Shipping:</span> <span>৳${order.shippingCost.toFixed(2)}</span></div>
            ${order.discount > 0 ? `<div class="row" style="color: #00a651"><span>Discount (${order.coupon_code || 'Promo'}):</span> <span>-৳${order.discount.toFixed(2)}</span></div>` : ''}
            <div class="row total-row"><span>Total:</span> <span>৳${order.total.toFixed(2)}</span></div>
          </div>
          
          <script>
            window.onload = () => { window.print(); }
          </script>
        </body>
      </html>
    `;

    invoiceWindow.document.write(html);
    invoiceWindow.document.close();
  };

  return (
    <div className="bg-[#fcfdfd] min-h-screen flex font-sans text-[#1a3a34]">
      {/* Sidebar */}
      <aside className="w-72 bg-[#004d40] text-white flex flex-col p-8 sticky top-0 h-screen shrink-0 shadow-2xl z-50">
        <div className="flex items-center gap-3 mb-10 px-2">
          <ShieldCheck className="text-emerald-400" size={36} />
          <span className="font-black text-2xl uppercase tracking-tighter">Admin <span className="text-emerald-400">SM</span></span>
        </div>
        <button onClick={async () => { setIsSyncing(true); await refreshAllData(); setIsSyncing(false); }} className="mb-6 flex items-center justify-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl py-3 px-4 text-[11px] font-black uppercase tracking-widest hover:bg-emerald-500/30 transition-all active:scale-95">
          <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} /> {isSyncing ? 'Syncing...' : 'Sync Database'}
        </button>
        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar">
          {[
            { id: 'products', icon: Package, label: 'Products' },
            { id: 'categories', icon: Layers, label: 'Categories' },
            { id: 'brands', icon: Globe, label: 'Brands' },
            { id: 'attributes', icon: Zap, label: 'Attributes' },
            { id: 'orders', icon: ShoppingBag, label: 'Orders' },
            { id: 'coupons', icon: Ticket, label: 'Coupons' },
            { id: 'reviews', icon: MessageSquare, label: 'Reviews' },
            { id: 'pages', icon: FileText, label: 'Pages' },
            { id: 'banners', icon: ImageIcon, label: 'Banners' },
            { id: 'users', icon: UsersIcon, label: 'Users & Roles' },
            { id: 'settings', icon: SettingsIcon, label: 'System' },
            { id: 'database', icon: Database, label: 'Database' },

            { id: 'reports', icon: BarChart3, label: 'Reports' },
            { id: 'layout', icon: LayoutTemplate, label: 'Home Layout' },
            { id: 'blog', icon: BookOpen, label: 'Blog' },
          ].map(item => (
            <button key={item.id} onClick={() => { setAdminTabState(item.id); closeForms(); }} className={`flex items-center gap-4 px-6 py-3.5 rounded-2xl transition-all font-bold text-sm ${adminTab === item.id ? 'bg-emerald-50 text-[#004d40] shadow-lg' : 'text-slate-300 hover:bg-white/10'}`}>
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-10 overflow-x-hidden">
        {adminTab === 'layout' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Home Layout</h2><p className="text-slate-400 text-sm">Manage homepage sections.</p></div>
              {!isAdding && !editingItem && (
                <button onClick={() => setIsAdding('section')} className="bg-[#00a651] text-white px-8 py-3.5 rounded-xl font-black uppercase text-[11px] flex items-center gap-2 shadow-xl hover:bg-[#008c44] transition-all"><Plus size={18} /> Add Section</button>
              )}
            </div>

            {(isAdding === 'section' || editingItem?.type === 'section') ? (
              <form onSubmit={handleSectionSubmit} className="bg-white rounded-2xl border border-emerald-100 p-10 shadow-xl space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Section Title</label>
                    <input required value={sectionForm.title} onChange={e => setSectionForm({ ...sectionForm, title: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Type</label>
                    <select value={sectionForm.type} onChange={e => setSectionForm({ ...sectionForm, type: e.target.value as any })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold outline-none">
                      <option value="slider">Slider (1 Row)</option>
                      <option value="grid">Grid (2 Rows + Banner)</option>
                      <option value="grid-no-banner">Grid (2 Rows, No Banner)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Filter Type</label>
                    <select value={sectionForm.filterType} onChange={e => setSectionForm({ ...sectionForm, filterType: e.target.value as any })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold outline-none">
                      <option value="all">All Products</option>
                      <option value="sale">On Sale</option>
                      <option value="featured">Featured</option>
                      <option value="category">Specific Category</option>
                    </select>
                  </div>
                  {sectionForm.filterType === 'category' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                      <select value={sectionForm.filterValue} onChange={e => setSectionForm({ ...sectionForm, filterValue: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold outline-none">
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sort Order</label>
                    <input type="number" value={sectionForm.sortOrder} onChange={e => setSectionForm({ ...sectionForm, sortOrder: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold outline-none" />
                  </div>
                </div>

                {sectionForm.type === 'grid' && (
                  <div className="border-t pt-6">
                    <h3 className="font-bold text-lg mb-4">Grid Banner Settings</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <input placeholder="Banner Title" value={sectionForm.banner?.title || ''} onChange={e => setSectionForm({ ...sectionForm, banner: { ...sectionForm.banner!, title: e.target.value } })} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold" />
                      <input placeholder="Description" value={sectionForm.banner?.description || ''} onChange={e => setSectionForm({ ...sectionForm, banner: { ...sectionForm.banner!, description: e.target.value } })} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold" />

                      <div className="col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Banner Image</label>
                        <div className="flex gap-3 items-center">
                          {sectionForm.banner?.imageUrl && <img src={sectionForm.banner.imageUrl} className="w-12 h-12 object-cover rounded-lg border border-slate-200" />}
                          <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors h-[46px]">
                            <Upload size={16} /> Upload
                            <input type="file" onChange={handleSectionBannerImageUpload} className="hidden" accept="image/*" />
                          </label>
                          <input placeholder="Or enter Image URL" value={sectionForm.banner?.imageUrl || ''} onChange={e => setSectionForm({ ...sectionForm, banner: { ...sectionForm.banner!, imageUrl: e.target.value } })} className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold outline-none" />
                        </div>
                      </div>

                      <input placeholder="Link" value={sectionForm.banner?.link || ''} onChange={e => setSectionForm({ ...sectionForm, banner: { ...sectionForm.banner!, link: e.target.value } })} className="col-span-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold" />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                  <button type="button" onClick={closeForms} className="px-6 py-3 text-slate-400 font-bold uppercase text-[11px] hover:text-slate-600">Cancel</button>
                  <button type="submit" className="bg-emerald-600 text-white px-10 py-3 rounded-xl font-black uppercase text-[11px] shadow-lg transition-all hover:bg-emerald-700">Save Section</button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {homeSections.sort((a, b) => a.sortOrder - b.sortOrder).map(section => (
                  <div key={section.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center group hover:border-emerald-200 transition-all">
                    <div>
                      <h3 className="font-black text-lg text-gray-800">{section.title}</h3>
                      <div className="flex gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded">{section.type}</span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded">Filter: {section.filterType}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEditSection(section)} className="bg-gray-50 p-2 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors"><Pencil size={18} /></button>
                      <button onClick={() => deleteHomeSection(section.id)} className="bg-gray-50 p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {adminTab === 'banners' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Banner Management</h2>
                <p className="text-gray-500 font-medium">Manage homepage slider and side banners</p>
              </div>
              <button onClick={() => setIsAdding('banner')} className="bg-[#00a651] hover:bg-[#008c44] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-200 transition-all active:scale-95">
                <PlusCircle size={20} /> Add Banner
              </button>
            </div>

            {isAdding === 'banner' && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl relative animate-in zoom-in-95 duration-200">
                  <button onClick={closeForms} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
                  <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2"><ImageIcon className="text-[#00a651]" /> Add New Banner</h3>
                  <form onSubmit={handleBannerSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Type</label>
                        <select value={bannerForm.type} onChange={e => setBannerForm({ ...bannerForm, type: e.target.value as any })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-[#00a651] transition-all">
                          <option value="slider">Main Slider</option>
                          <option value="right_top">Right Top Banner</option>
                          <option value="right_bottom">Right Bottom Banner</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sort Order</label>
                        <input type="number" value={bannerForm.sort_order} onChange={e => setBannerForm({ ...bannerForm, sort_order: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-[#00a651] transition-all" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Banner Image</label>
                      <div className="flex items-center gap-4">
                        {bannerForm.image_url && <img src={bannerForm.image_url} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-gray-200" />}
                        <label className="cursor-pointer bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-[#00a651] px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border border-gray-100 transition-all flex items-center gap-2">
                          <ImageIcon size={16} /> Upload Image
                          <input type="file" accept="image/*" onChange={handleBannerImageUpload} className="hidden" />
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Title (Optional)</label><input value={bannerForm.title} onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-[#00a651] transition-all" placeholder="Big Sale" /></div>
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subtitle (Optional)</label><input value={bannerForm.subtitle} onChange={e => setBannerForm({ ...bannerForm, subtitle: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-[#00a651] transition-all" placeholder="Up to 50% off" /></div>
                    </div>
                    <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Link (Optional)</label><input value={bannerForm.link} onChange={e => setBannerForm({ ...bannerForm, link: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-[#00a651] transition-all" placeholder="/category/vegetables" /></div>
                    <button type="submit" className="w-full bg-[#00a651] hover:bg-[#008c44] text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-200 transition-all active:scale-95">Save Banner</button>
                  </form>
                </div>
              </div>
            )}

            <div className="space-y-8">
              {/* Slider Banners Section */}
              <div>
                <h3 className="text-lg font-black text-gray-700 mb-4 flex items-center gap-2">
                  <span className="w-2 h-8 bg-purple-500 rounded-full"></span>
                  Slider Banners
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {banners.filter(b => b.type === 'slider').map(banner => (
                    <div key={banner.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative group overflow-hidden">
                      <div className="aspect-video bg-gray-100 rounded-2xl mb-4 overflow-hidden relative">
                        <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute top-2 right-2 bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase backdrop-blur-md">
                          Slider
                        </div>
                      </div>
                      <h3 className="font-bold text-gray-800 text-lg mb-1">{banner.title || 'Untitled Banner'}</h3>
                      <p className="text-sm text-gray-500 mb-4">{banner.subtitle || 'No subtitle'}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">Order: {banner.sort_order}</span>
                        <button onClick={() => deleteBanner(banner.id)} className="bg-red-50 text-red-500 p-2 rounded-xl hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                  {banners.filter(b => b.type === 'slider').length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400 font-medium italic bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                      No slider banners added yet
                    </div>
                  )}
                </div>
              </div>

              {/* Right Banners Section */}
              <div>
                <h3 className="text-lg font-black text-gray-700 mb-4 flex items-center gap-2">
                  <span className="w-2 h-8 bg-orange-500 rounded-full"></span>
                  Right Side Banners
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {banners.filter(b => b.type.startsWith('right_')).map(banner => (
                    <div key={banner.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative group overflow-hidden">
                      <div className="aspect-video bg-gray-100 rounded-2xl mb-4 overflow-hidden relative">
                        <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase backdrop-blur-md">
                          {banner.type === 'right_top' ? 'Top Right' : 'Bottom Right'}
                        </div>
                      </div>
                      <h3 className="font-bold text-gray-800 text-lg mb-1">{banner.title || 'Untitled Banner'}</h3>
                      <p className="text-sm text-gray-500 mb-4">{banner.subtitle || 'No subtitle'}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">Order: {banner.sort_order}</span>
                        <button onClick={() => deleteBanner(banner.id)} className="bg-red-50 text-red-500 p-2 rounded-xl hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                  {banners.filter(b => b.type.startsWith('right_')).length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400 font-medium italic bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                      No right side banners added yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {adminTab === 'reports' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Business Reports</h2>
                <p className="text-gray-500 font-medium">Insights and analytics for your store</p>
              </div>
              <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-200">
                <div className="flex flex-col px-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">From</label>
                  <input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} className="bg-transparent font-bold text-gray-800 outline-none text-sm" />
                </div>
                <div className="w-px h-8 bg-gray-300"></div>
                <div className="flex flex-col px-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">To</label>
                  <input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} className="bg-transparent font-bold text-gray-800 outline-none text-sm" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Summary Cards */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-gray-500 font-bold uppercase text-xs tracking-widest mb-2">Total Revenue</h3>
                <p className="text-3xl font-black text-emerald-600">৳{Object.values(reportData.salesByDate).reduce((a, b) => a + b, 0).toFixed(2)}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-gray-500 font-bold uppercase text-xs tracking-widest mb-2">New Customers</h3>
                <p className="text-3xl font-black text-blue-600">{reportData.newCustomersCount}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-gray-500 font-bold uppercase text-xs tracking-widest mb-2">Coupon Orders</h3>
                <p className="text-3xl font-black text-purple-600">{Object.values(reportData.couponsByDate).reduce((a, b) => a + b, 0)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Sales by Date */}
              <div className="bg-white p-8 rounded-[30px] border border-gray-100 shadow-sm">
                <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2"><Calendar size={20} className="text-emerald-500" /> Sales by Date</h3>
                <div className="overflow-y-auto max-h-80 custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="text-xs font-black text-gray-400 uppercase tracking-widest sticky top-0 bg-white">
                      <tr><th className="py-3 border-b-2">Date</th><th className="py-3 border-b-2 text-right">Revenue</th></tr>
                    </thead>
                    <tbody>
                      {Object.entries(reportData.salesByDate).length === 0 ? (
                        <tr><td colSpan={2} className="text-center py-8 text-gray-400 italic">No sales in this period</td></tr>
                      ) : (
                        Object.entries(reportData.salesByDate).map(([date, total]) => (
                          <tr key={date} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="py-3 font-medium text-gray-600">{date}</td>
                            <td className="py-3 font-bold text-gray-800 text-right">৳{total.toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sales by Category */}
              <div className="bg-white p-8 rounded-[30px] border border-gray-100 shadow-sm">
                <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2"><Layers size={20} className="text-blue-500" /> Sales by Category</h3>
                <div className="space-y-4">
                  {Object.entries(reportData.salesByCategory).length === 0 ? (
                    <p className="text-center py-8 text-gray-400 italic">No data available</p>
                  ) : (
                    Object.entries(reportData.salesByCategory)
                      .sort(([, a], [, b]) => b - a)
                      .map(([cat, total]) => {
                        const maxVal = Math.max(...Object.values(reportData.salesByCategory));
                        const percent = (total / maxVal) * 100;
                        return (
                          <div key={cat} className="group">
                            <div className="flex justify-between text-sm font-bold text-gray-600 mb-1">
                              <span>{cat}</span>
                              <span>৳{total.toFixed(2)}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>
                        )
                      })
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Sales by Product */}
              <div className="bg-white p-8 rounded-[30px] border border-gray-100 shadow-sm">
                <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2"><Package size={20} className="text-purple-500" /> Top Products</h3>
                <div className="overflow-y-auto max-h-80 custom-scrollbar">
                  <table className="w-full text-left">
                    <thead className="text-xs font-black text-gray-400 uppercase tracking-widest sticky top-0 bg-white">
                      <tr><th className="py-3 border-b-2">Product</th><th className="py-3 border-b-2 text-right">Qty</th><th className="py-3 border-b-2 text-right">Revenue</th></tr>
                    </thead>
                    <tbody>
                      {reportData.salesByProduct.length === 0 ? (
                        <tr><td colSpan={3} className="text-center py-8 text-gray-400 italic">No product sales found</td></tr>
                      ) : (
                        reportData.salesByProduct.map((p, idx) => (
                          <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="py-3 font-medium text-gray-700 truncate max-w-[200px]">{p.name}</td>
                            <td className="py-3 font-medium text-gray-600 text-right">{p.quantity}</td>
                            <td className="py-3 font-bold text-gray-800 text-right">৳{p.revenue.toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Coupons and Customers Brief */}
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-[30px] border border-gray-100 shadow-sm">
                  <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2"><Ticket size={20} className="text-pink-500" /> Coupon Usage by Date</h3>
                  <div className="overflow-y-auto max-h-40 custom-scrollbar">
                    {Object.entries(reportData.couponsByDate).length === 0 ? (
                      <p className="text-center py-4 text-gray-400 italic">No coupons used</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(reportData.couponsByDate).map(([date, count]) => (
                          <div key={date} className="bg-pink-50 p-3 rounded-xl border border-pink-100 flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-600">{date}</span>
                            <span className="bg-white px-2 py-0.5 rounded-md text-xs font-black text-pink-600 shadow-sm">{count} Used</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-white p-8 rounded-[30px] border border-gray-100 shadow-sm">
                  <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2"><UsersIcon size={20} className="text-orange-500" /> Customer Report</h3>
                  <div className="overflow-y-auto max-h-80 custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest sticky top-0 bg-white">
                        <tr>
                          <th className="py-3 border-b text-emerald-600">Customer Name</th>
                          <th className="py-3 border-b text-gray-500">Email</th>
                          <th className="py-3 border-b text-center text-gray-500">Orders</th>
                          <th className="py-3 border-b text-right text-emerald-600">Total Spent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.customerReport.length === 0 ? (
                          <tr><td colSpan={4} className="text-center py-8 text-gray-400 italic">No customer activity found</td></tr>
                        ) : (
                          reportData.customerReport.map((c, idx) => (
                            <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="py-3 font-bold text-gray-700">{c.name}</td>
                              <td className="py-3 text-sm text-gray-500">{c.email}</td>
                              <td className="py-3 font-bold text-gray-700 text-center">{c.orders}</td>
                              <td className="py-3 font-black text-gray-800 text-right">৳{c.spent.toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pages Tab */}
        {
          adminTab === 'pages' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Pages</h2><p className="text-slate-400 text-sm">Create and manage content pages.</p></div>
                {!isAdding && !editingItem && (
                  <button onClick={() => setIsAdding('page')} className="bg-[#00a651] text-white px-8 py-3.5 rounded-xl font-black uppercase text-[11px] flex items-center gap-2 shadow-xl hover:bg-[#008c44] transition-all"><Plus size={18} /> Add Page</button>
                )}
              </div>

              {(isAdding === 'page' || editingItem?.type === 'page') ? (
                <form onSubmit={handlePageSubmit} className="bg-white rounded-2xl border border-emerald-100 p-10 shadow-xl space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Page Title</label>
                    <input required value={pageForm.title} onChange={e => {
                      const title = e.target.value;
                      const slug = title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
                      setPageForm({ ...pageForm, title, slug: pageForm.slug === '' || isAdding === 'page' ? slug : pageForm.slug })
                    }} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-base font-bold outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Slug (URL Path)</label>
                    <input required value={pageForm.slug} onChange={e => setPageForm({ ...pageForm, slug: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold outline-none text-emerald-600" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Page Builder</label>
                    <PageBuilder initialContent={pageForm.content} onChange={content => setPageForm({ ...pageForm, content })} />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={pageForm.isPublished} onChange={e => setPageForm({ ...pageForm, isPublished: e.target.checked })} className="w-5 h-5 accent-emerald-500" />
                      <span className="text-sm font-bold text-gray-700">Published</span>
                    </label>
                  </div>
                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <button type="button" onClick={closeForms} className="px-6 py-3 text-slate-400 font-bold uppercase text-[11px] hover:text-slate-600">Cancel</button>
                    <button type="submit" className="bg-emerald-600 text-white px-10 py-3 rounded-xl font-black uppercase text-[11px] shadow-lg transition-all hover:bg-emerald-700">Save Page</button>
                  </div>
                </form>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b text-[10px] uppercase font-black text-slate-400 tracking-widest">
                      <tr><th className="px-8 py-6">Title</th><th className="px-6 py-6">Slug</th><th className="px-6 py-6">Status</th><th className="px-8 py-6 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {pages.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50 group transition-colors">
                          <td className="px-8 py-5 font-bold text-gray-700">{p.title}</td>
                          <td className="px-6 py-5 text-emerald-600 font-medium text-sm">/{p.slug}</td>
                          <td className="px-6 py-5"><span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${p.isPublished ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>{p.isPublished ? 'Published' : 'Draft'}</span></td>
                          <td className="px-8 py-5 text-right flex justify-end gap-2">
                            <a href={`/${p.slug}`} target="_blank" rel="noreferrer" className="bg-white p-2.5 rounded-xl border border-slate-100 text-slate-300 hover:text-emerald-500 shadow-sm"><Eye size={18} /></a>
                            <button onClick={() => startEditPage(p)} className="bg-white p-2.5 rounded-xl border border-slate-100 text-slate-300 hover:text-blue-500 shadow-sm"><Pencil size={18} /></button>
                            <button onClick={() => deletePage(p.id)} className="bg-white p-2.5 rounded-xl border border-slate-100 text-slate-300 hover:text-red-500 shadow-sm"><Trash2 size={18} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        }

        {/* Blog Tab */}
        {adminTab === 'blog' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Blog Posts</h2><p className="text-slate-400 text-sm">Manage your blog articles.</p></div>
              {!isAdding && !editingItem && (
                <button onClick={() => setIsAdding('blog')} className="bg-[#00a651] text-white px-8 py-3.5 rounded-xl font-black uppercase text-[11px] flex items-center gap-2 shadow-xl hover:bg-[#008c44] transition-all"><Plus size={18} /> Add Post</button>
              )}
            </div>

            {(isAdding === 'blog' || editingItem?.type === 'blog') ? (
              <form onSubmit={handleBlogSubmit} className="bg-white rounded-2xl border border-emerald-100 p-10 shadow-xl space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Post Title</label>
                  <input required value={blogForm.title} onChange={e => {
                    const title = e.target.value;
                    const slug = title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
                    setBlogForm({ ...blogForm, title, slug: blogForm.slug === '' || isAdding === 'blog' ? slug : blogForm.slug })
                  }} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-base font-bold outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Slug</label>
                  <input required value={blogForm.slug} onChange={e => setBlogForm({ ...blogForm, slug: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold outline-none text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Author</label>
                  <input required value={blogForm.author} onChange={e => setBlogForm({ ...blogForm, author: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Featured Image</label>
                  <div className="flex gap-3 items-center">
                    {blogForm.imageUrl && <img src={blogForm.imageUrl} className="w-12 h-12 object-cover rounded-lg border border-slate-200" />}
                    <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors h-[46px]">
                      <Upload size={16} /> Upload
                      <input type="file" onChange={handleBlogImageUpload} className="hidden" accept="image/*" />
                    </label>
                    <input placeholder="Or enter Image URL" required={!blogForm.imageUrl} value={blogForm.imageUrl} onChange={e => setBlogForm({ ...blogForm, imageUrl: e.target.value })} className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3.5 font-bold outline-none text-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Excerpt</label>
                  <textarea required value={blogForm.excerpt} onChange={e => setBlogForm({ ...blogForm, excerpt: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold outline-none h-24" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Content</label>
                  <RichTextEditor value={blogForm.content} onChange={val => setBlogForm({ ...blogForm, content: val })} label="Article Content" height="400px" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tags (comma separated)</label>
                  <input value={blogForm.tags.join(', ')} onChange={e => setBlogForm({ ...blogForm, tags: e.target.value.split(',').map(t => t.trim()) })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold outline-none" />
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                  <button type="button" onClick={closeForms} className="px-6 py-3 text-slate-400 font-bold uppercase text-[11px] hover:text-slate-600">Cancel</button>
                  <button type="submit" className="bg-emerald-600 text-white px-10 py-3 rounded-xl font-black uppercase text-[11px] shadow-lg transition-all hover:bg-emerald-700">Save Post</button>
                </div>
              </form>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b text-[10px] uppercase font-black text-slate-400 tracking-widest">
                    <tr><th className="px-8 py-6">Title</th><th className="px-6 py-6">Author</th><th className="px-6 py-6">Date</th><th className="px-8 py-6 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {blogPosts.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 group transition-colors">
                        <td className="px-8 py-5 font-bold text-gray-700">{p.title}</td>
                        <td className="px-6 py-5 text-gray-500 font-medium text-sm">{p.author}</td>
                        <td className="px-6 py-5 text-gray-400 text-sm">{p.date}</td>
                        <td className="px-8 py-5 text-right flex justify-end gap-2">
                          <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" className="bg-white p-2.5 rounded-xl border border-slate-100 text-slate-300 hover:text-emerald-500 shadow-sm"><Eye size={18} /></a>
                          <button onClick={() => startEditBlog(p)} className="bg-white p-2.5 rounded-xl border border-slate-100 text-slate-300 hover:text-blue-500 shadow-sm"><Pencil size={18} /></button>
                          <button onClick={() => deleteBlogPost(p.id)} className="bg-white p-2.5 rounded-xl border border-slate-100 text-slate-300 hover:text-red-500 shadow-sm"><Trash2 size={18} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Products Tab */}
        {adminTab === 'products' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {!(isAdding === 'product' || editingItem?.type === 'product') ? (
              <>
                <div className="flex justify-between items-center">
                  <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Products</h2><p className="text-slate-400 text-sm">Manage your product catalog.</p></div>
                  <button onClick={() => setIsAdding('product')} className="bg-[#00a651] text-white px-8 py-3.5 rounded-xl font-black uppercase text-[11px] flex items-center gap-2 shadow-xl hover:bg-[#008c44] transition-all"><Plus size={18} /> Add Product</button>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b text-[10px] uppercase font-black text-slate-400 tracking-widest">
                      <tr><th className="px-8 py-6">Product</th><th className="px-6 py-6">Category</th><th className="px-6 py-6">Price Details (৳)</th><th className="px-8 py-6 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {products.map(p => {
                        const { mrp, sale } = getProductDisplayPrice(p);
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50 group transition-colors">
                            <td className="px-8 py-5 flex items-center gap-4">
                              <div className="w-12 h-12 bg-slate-50 rounded-xl p-1 border border-slate-100 flex items-center justify-center shrink-0">
                                {(!p.images?.[0] || brokenImages[p.id]) ? <ImageIcon className="text-slate-200" size={20} /> : <img src={p.images[0]} className="max-h-full max-w-full object-contain" onError={() => handleImageError(p.id)} />}
                              </div>
                              <div className="min-w-0"><span className="font-bold text-slate-700 block truncate max-w-xs">{p.name}</span><span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">SKU: {p.sku || 'N/A'}</span></div>
                            </td>
                            <td className="px-6 py-5 text-slate-400 font-medium text-sm">{p.category}</td>
                            <td className="px-6 py-5">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">MRP: {mrp?.toFixed(2)}</span>
                                {sale && <span className="text-sm font-black text-[#00a651]">Sale: {sale.toFixed(2)}</span>}
                              </div>
                            </td>
                            <td className="px-8 py-5 text-right flex justify-end gap-2">
                              <button onClick={() => startEditProduct(p)} className="bg-white p-2.5 rounded-xl border border-slate-100 text-slate-300 hover:text-blue-500 shadow-sm"><Pencil size={18} /></button>
                              <button onClick={() => deleteProduct(p.id)} className="bg-white p-2.5 rounded-xl border border-slate-100 text-slate-300 hover:text-red-500 shadow-sm"><Trash2 size={18} /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="max-w-5xl mx-auto space-y-8 pb-20">
                <div className="flex items-center justify-between">
                  <button onClick={closeForms} className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-bold text-sm uppercase tracking-widest transition-colors"><ChevronRight size={20} className="rotate-180" /> Back</button>
                  <button onClick={handleProductSubmit} className="bg-[#00a651] text-white px-10 py-3.5 rounded-xl font-black uppercase text-xs shadow-lg hover:bg-[#008c44] flex items-center gap-2"><Save size={18} /> Save Product</button>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-[#1a3a34]">Images</h3>
                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-[#d1e7dd] rounded-2xl bg-[#f9fdfb] py-16 flex flex-col items-center justify-center cursor-pointer hover:bg-[#f0f9f4] transition-all group">
                      <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={(e) => {
                        Array.from(e.target.files || []).forEach((file: File) => {
                          const reader = new FileReader();
                          reader.onloadend = () => setProdForm(prev => ({ ...prev, images: [...prev.images, reader.result as string] }));
                          reader.readAsDataURL(file);
                        });
                      }} />
                      <PlusCircle size={32} className="text-[#00a651] mb-2" />
                      <p className="text-[#00a651] font-black text-lg">Click to select product images</p>
                    </div>
                    <div className="flex flex-wrap gap-4">{prodForm.images.map((img, idx) => (<div key={idx} className="relative w-24 h-24 border rounded-xl overflow-hidden p-2"><img src={img} className="w-full h-full object-contain" /><button onClick={() => setProdForm(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X size={10} /></button></div>))}</div>
                  </div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Name</label><input required value={prodForm.name} onChange={e => setProdForm({ ...prodForm, name: e.target.value })} className="w-full bg-[#f9fdfb] border border-[#d1e7dd] rounded-xl px-6 py-4 text-base font-bold outline-none focus:ring-2 focus:ring-[#00a651]" /></div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Regular M.R.P (৳)</label><input required type="number" value={prodForm.basePrice} onChange={e => setProdForm({ ...prodForm, basePrice: e.target.value })} className="w-full bg-[#f9fdfb] border border-[#d1e7dd] rounded-xl px-6 py-4 text-sm font-bold" placeholder="Base Retail Price" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sale Price (৳) - Optional</label><input type="number" value={prodForm.salePrice} onChange={e => setProdForm({ ...prodForm, salePrice: e.target.value })} className="w-full bg-[#f9fdfb] border border-[#d1e7dd] rounded-xl px-6 py-4 text-sm font-bold text-emerald-600" placeholder="Selling Price" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label><select required value={prodForm.category} onChange={e => setProdForm({ ...prodForm, category: e.target.value })} className="w-full bg-[#f9fdfb] border border-[#d1e7dd] rounded-xl px-6 py-4 text-sm font-bold appearance-none"><option value="">Select Category</option>{hierarchicalCategories.map(c => <option key={c.id} value={c.name}>{'\u00A0'.repeat(c.level * 4) + (c.level > 0 ? '↳ ' : '') + c.name}</option>)}</select></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Brand</label><select value={prodForm.brand} onChange={e => setProdForm({ ...prodForm, brand: e.target.value })} className="w-full bg-[#f9fdfb] border border-[#d1e7dd] rounded-xl px-6 py-4 text-sm font-bold appearance-none"><option value="">No Brand</option>{brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}</select></div>
                  </div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Short Description</label><RichTextEditor value={prodForm.shortDescription} onChange={val => setProdForm({ ...prodForm, shortDescription: val })} label="Brief Overview" height="150px" /></div>
                  <div className="space-y-2 pt-10"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Description</label><RichTextEditor value={prodForm.description} onChange={val => setProdForm({ ...prodForm, description: val })} label="Long Product Content" height="300px" /></div>

                  <div className="space-y-6 pt-10 border-t border-gray-100">
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-[#004d40]">Attributes & Variants</h3>
                      <p className="text-sm text-gray-500">Manage size, color, or other options with dynamic pricing.</p>
                    </div>
                    {prodForm.tempAttributes.map((attr, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-emerald-50/20 p-4 rounded-xl border border-emerald-100/50">
                        <div className="flex gap-2 items-center">
                          <span className="font-black text-[#004d40] text-xs uppercase tracking-widest">{attr.name}:</span>
                          <div className="flex flex-wrap gap-1">
                            {attr.options.map((opt, i) => (<span key={i} className="bg-white border border-emerald-200 px-2 py-0.5 rounded-lg text-[10px] font-bold text-emerald-700">{opt}</span>))}
                          </div>
                        </div>
                        <button type="button" onClick={() => removeTempAttribute(idx)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                      </div>
                    ))}
                    {showAttrForm ? (
                      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-6 relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => setShowAttrForm(false)} className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"><X size={20} /></button>
                        <div className="space-y-2">
                          <label className="text-[13px] font-medium text-gray-600">Use Global Attribute (Optional)</label>
                          <div className="relative">
                            <select onChange={(e) => handleGlobalAttrSelect(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:ring-1 focus:ring-emerald-500 appearance-none bg-white text-gray-400">
                              <option value="">Select a global attribute...</option>
                              {attributes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18} />
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="flex-1 space-y-2">
                            <label className="text-[13px] font-medium text-gray-600">Attribute Name</label>
                            <input placeholder="e.g. Color" value={draftAttr.name} onChange={(e) => setDraftAttr(p => ({ ...p, name: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:ring-1 focus:ring-emerald-500" />
                          </div>
                          <div className="flex-[2] space-y-2">
                            <label className="text-[13px] font-medium text-gray-600">Options</label>
                            <div className="flex gap-2">
                              <input placeholder="e.g. Red" value={draftAttr.currentOption} onChange={(e) => setDraftAttr(prev => ({ ...prev, currentOption: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())} className="flex-1 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:ring-1 focus:ring-emerald-500" />
                              <button type="button" onClick={handleAddOption} className="bg-[#00a651] text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-[#008c44] transition-all active:scale-95">Add</button>
                            </div>
                            <p className="text-[12px] text-emerald-600/70 font-medium">Enter an option and click Add or press Enter.</p>
                          </div>
                        </div>
                        {draftAttr.options.length > 0 && (
                          <div className="pt-4 border-t flex flex-col gap-4">
                            <div className="flex flex-wrap gap-2">
                              {draftAttr.options.map((o, i) => (
                                <span key={i} className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 text-xs font-bold shadow-sm">
                                  {o}
                                  <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => setDraftAttr(p => ({ ...p, options: p.options.filter((_, idx) => idx !== i) }))} />
                                </span>
                              ))}
                            </div>
                            <div className="flex justify-end pt-2">
                              <button type="button" onClick={commitDraftAttribute} className="bg-[#004d40] text-white px-10 py-3.5 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-lg hover:bg-black transition-all">Confirm Attribute Block</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button type="button" onClick={() => setShowAttrForm(true)} className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 shadow-sm transition-all"><PlusCircle size={18} className="text-[#00a651]" /> Add Attribute</button>
                    )}
                    <button type="button" onClick={generateVariants} className="w-full bg-slate-800 text-white px-6 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2">Generate Variants Table</button>
                    {prodForm.variants.length > 0 && (
                      <div className="space-y-3">
                        {prodForm.variants.map((v, vIdx) => (
                          <div key={v.id} className="grid grid-cols-12 gap-4 p-4 bg-gray-50 rounded-2xl items-center">
                            <div className="col-span-3 font-black text-xs text-[#004d40]">{Object.values(v.attributeValues).join(' / ')}</div>
                            <div className="col-span-3"><input type="number" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold" value={v.originalPrice || v.price} onChange={e => { const vs = [...prodForm.variants]; vs[vIdx].originalPrice = parseFloat(e.target.value); setProdForm({ ...prodForm, variants: vs }); }} placeholder="MRP" /></div>
                            <div className="col-span-3"><input type="number" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-emerald-600" value={v.price} onChange={e => { const vs = [...prodForm.variants]; vs[vIdx].price = parseFloat(e.target.value); setProdForm({ ...prodForm, variants: vs }); }} placeholder="Selling Price" /></div>
                            <div className="col-span-3"><input className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold" value={v.stock} onChange={e => { const vs = [...prodForm.variants]; vs[vIdx].stock = parseInt(e.target.value); setProdForm({ ...prodForm, variants: vs }); }} placeholder="Stock" /></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
        }

        {/* Global Attributes Tab - FIXED COMMA ISSUE AND REFINED UI */}
        {
          adminTab === 'attributes' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Global Attributes</h2><p className="text-slate-400 text-sm">Define global variant options like Size, Color, etc.</p></div>
                <button onClick={() => { setIsAdding('attribute'); setAttrForm({ name: '' }); setAttrValuesInput(''); }} className="bg-[#00a651] text-white px-8 py-3.5 rounded-xl font-black uppercase text-[11px] flex items-center gap-2 shadow-xl"><Plus size={18} /> Add Attribute</button>
              </div>

              {(isAdding === 'attribute' || editingItem?.type === 'attribute') && (
                <form onSubmit={handleAttributeSubmit} className="bg-white rounded-2xl border border-emerald-100 p-10 shadow-xl space-y-10">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest ml-1">Attribute Name</label>
                      <input required value={attrForm.name} onChange={e => setAttrForm({ ...attrForm, name: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-6 py-4 text-sm font-bold outline-none focus:border-black" placeholder="e.g. Size" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest ml-1">VALUES (COMMA SEPARATED)</label>
                      <input
                        required
                        value={attrValuesInput}
                        onChange={e => setAttrValuesInput(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-6 py-4 text-sm font-bold outline-none focus:border-black"
                        placeholder="e.g. 50ml, 100ml"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end items-center gap-8">
                    <button type="button" onClick={closeForms} className="text-gray-400 hover:text-gray-600 font-black uppercase text-[13px] tracking-widest transition-colors">CANCEL</button>
                    <button type="submit" className="bg-[#00a651] text-white px-10 py-4 rounded-xl font-black uppercase text-[13px] tracking-widest shadow-lg transition-all hover:bg-[#008c44] active:scale-95">SAVE ATTRIBUTE</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {attributes.map(attr => (
                  <div key={attr.id} className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4 group hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center">
                      <h3 className="font-black text-gray-800 uppercase tracking-widest text-xs">{attr.name}</h3>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingItem({ type: 'attribute', data: attr }); setAttrForm({ name: attr.name }); setAttrValuesInput(attr.values.map(v => v.value).join(', ')); }} className="text-gray-400 hover:text-blue-500"><Pencil size={16} /></button>
                        <button onClick={() => deleteAttribute(attr.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {attr.values.map(v => (<span key={v.id} className="bg-gray-50 text-gray-500 px-3 py-1 rounded-lg text-xs font-bold border border-gray-100">{v.value}</span>))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        }

        {/* Categories Tab */}
        {
          adminTab === 'categories' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Categories</h2><p className="text-slate-400 text-sm">Organize your products catalog.</p></div>
                <button onClick={() => setIsAdding('category')} className="bg-[#ffa319] text-white px-8 py-3.5 rounded-xl font-black uppercase text-[11px] flex items-center gap-2 shadow-xl hover:bg-[#e69217] transition-all"><Plus size={18} /> Add Category</button>
              </div>
              {(isAdding === 'category' || editingItem?.type === 'category') && (
                <form onSubmit={handleCategorySubmit} className="bg-white rounded-2xl border border-emerald-100 p-8 shadow-xl animate-in slide-in-from-top-4 duration-500 space-y-6">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Category Name</label><input required value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold outline-none" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Parent Category</label><select value={catForm.parentId || ''} onChange={e => setCatForm({ ...catForm, parentId: e.target.value || null })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold"><option value="">None (Top Level)</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  </div>
                  <div className="flex justify-end gap-3"><button type="button" onClick={closeForms} className="px-6 py-3 text-slate-400 font-bold uppercase text-[11px]">Cancel</button><button type="submit" className="bg-emerald-600 text-white px-10 py-3 rounded-xl font-black uppercase text-[11px] shadow-lg transition-all hover:bg-emerald-700">Save Category</button></div>
                </form>
              )}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b text-[10px] uppercase font-black text-slate-400 tracking-widest">
                    <tr><th className="px-8 py-6">Category Name</th><th className="px-6 py-6">Parent</th><th className="px-8 py-6 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {hierarchicalCategories.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/50 group transition-colors">
                        <td className="px-8 py-5"><div className="flex items-center gap-3" style={{ marginLeft: `${c.level * 24}px` }}>{c.level > 0 && <ChevronRight size={14} className="text-slate-300" />}<span className={`font-bold text-slate-700 ${c.level === 0 ? 'text-base' : 'text-sm'}`}>{c.name}</span></div></td>
                        <td className="px-6 py-5 text-slate-400 font-medium text-xs">{c.parentId ? categories.find(cat => cat.id === c.parentId)?.name : 'Top Level'}</td>
                        <td className="px-8 py-5 text-right flex justify-end gap-2">
                          <button onClick={() => { setEditingItem({ type: 'category', data: c }); setCatForm({ name: c.name, parentId: c.parentId || null, image: c.image }); }} className="bg-white p-2.5 rounded-xl border border-slate-100 text-slate-300 hover:text-blue-500 shadow-sm"><Pencil size={18} /></button>
                          <button onClick={() => deleteCategory(c.id)} className="bg-white p-2.5 rounded-xl border border-slate-100 text-slate-300 hover:text-red-500 shadow-sm"><Trash2 size={18} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        }

        {/* Brands Tab */}
        {
          adminTab === 'brands' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Brands</h2><p className="text-slate-400 text-sm">Manage product brands and logos.</p></div>
                <button onClick={() => setIsAdding('brand')} className="bg-[#00a651] text-white px-8 py-3.5 rounded-xl font-black uppercase text-[11px] flex items-center gap-2 shadow-xl"><Plus size={18} /> Add Brand</button>
              </div>
              {(isAdding === 'brand' || editingItem?.type === 'brand') && (
                <form onSubmit={handleBrandSubmit} className="bg-white rounded-2xl border border-emerald-100 p-8 shadow-xl space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Brand Name</label>
                        <input required value={brandForm.name} onChange={e => {
                          const name = e.target.value;
                          const slug = name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
                          setBrandForm({ ...brandForm, name, slug: brandForm.slug || isAdding === 'brand' ? slug : brandForm.slug });
                        }} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Slug (URL Path)</label>
                        <input value={brandForm.slug} onChange={e => setBrandForm({ ...brandForm, slug: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold text-emerald-600" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Brand Logo (Optional)</label>
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-24 bg-gray-50 rounded-xl border border-slate-200 flex items-center justify-center relative overflow-hidden group">
                          {brandForm.logo_url ? (
                            <>
                              <img src={brandForm.logo_url} className="w-full h-full object-contain p-2" alt="logo preview" />
                              <button type="button" onClick={() => setBrandForm({ ...brandForm, logo_url: '' })} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <X size={20} />
                              </button>
                            </>
                          ) : (
                            <ImageIcon className="text-gray-300" size={32} />
                          )}
                        </div>
                        <div className="flex-1">
                          <label className="cursor-pointer bg-[#004d40] text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2 w-fit">
                            <Upload size={14} /> Upload Logo
                            <input type="file" className="hidden" accept="image/*" onChange={handleBrandLogoUpload} />
                          </label>
                          <p className="text-[10px] text-gray-400 mt-2 font-medium">Recommended size: 200x200px. <br /> Transparent PNG works best.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3"><button type="button" onClick={closeForms} className="px-6 py-3 text-slate-400 font-bold uppercase text-[11px]">Cancel</button><button type="submit" className="bg-emerald-600 text-white px-10 py-3 rounded-xl font-black uppercase text-[11px]">Save Brand</button></div>
                </form>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {brands.map(brand => (
                  <div key={brand.id} className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center p-1.5 border border-gray-50 shadow-sm">{brand.logo_url ? <img src={brand.logo_url} className="max-h-full max-w-full object-contain" /> : <Globe className="text-gray-300" />}</div>
                      <span className="font-bold text-gray-700">{brand.name}</span>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingItem({ type: 'brand', data: brand }); setBrandForm({ name: brand.name, slug: brand.slug || '', logo_url: brand.logo_url || '' }); }} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg"><Pencil size={16} /></button>
                      <button onClick={() => deleteBrand(brand.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        }

        {/* Orders Tab */}
        {
          adminTab === 'orders' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Order Management</h2><p className="text-slate-400 text-sm">Process incoming orders and update tracking status.</p></div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b text-[10px] uppercase font-black text-slate-400 tracking-widest">
                    <tr><th className="px-8 py-6">Order ID</th><th className="px-6 py-6">Customer</th><th className="px-6 py-6">Date</th><th className="px-6 py-6">Total</th><th className="px-6 py-6">Status</th><th className="px-8 py-6 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50/50 group transition-colors">
                        <td className="px-8 py-5 font-black text-gray-800">#{order.id}</td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col"><span className="font-bold text-gray-700">{order.customerName}</span><span className="text-xs text-gray-400">{order.customerPhone}</span></div>
                        </td>
                        <td className="px-6 py-5 text-gray-400 font-bold text-sm">{new Date(order.date).toLocaleDateString()}</td>
                        <td className="px-6 py-5 font-black text-gray-900">৳{order.total.toFixed(2)}</td>
                        <td className="px-6 py-5">
                          <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getOrderStatusColor(order.status)}`}>{order.status}</span>
                        </td>
                        <td className="px-8 py-5 text-right flex justify-end gap-2">
                          <button onClick={() => { setViewingOrder(order); setIsEditingOrder(false); }} className="bg-white p-2.5 rounded-xl border border-slate-100 text-slate-300 hover:text-emerald-500 shadow-sm"><Eye size={18} /></button>
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                            className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                          >
                            {['Pending', 'Processing', 'Delivered', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {viewingOrder && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                  <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-10 shadow-2xl space-y-10 animate-in zoom-in-95 relative">
                    <div className="flex justify-between items-center border-b pb-6">
                      <div className="flex items-center gap-4">
                        <h3 className="text-2xl font-black text-gray-800">Order Details <span className="text-emerald-500">#{viewingOrder.id}</span></h3>
                        {!isEditingOrder && (
                          <div className="flex gap-2">
                            <button onClick={() => printInvoice(viewingOrder)} className="flex items-center gap-1.5 bg-slate-50 text-slate-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-100 transition-colors">
                              <Printer size={12} /> Print Invoice
                            </button>
                            <button onClick={startEditingOrder} className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-colors">
                              <Edit3 size={12} /> Edit Order
                            </button>
                          </div>
                        )}
                      </div>
                      <button onClick={closeForms} className="text-gray-300 hover:text-red-500"><X size={32} /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Customer Information</h4>
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4 text-sm">
                          {isEditingOrder ? (
                            <>
                              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Customer Name</label><input value={editingOrderData?.customerName} onChange={e => updateCustomerInfo('customerName', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-1 focus:ring-emerald-500" /></div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label><input value={editingOrderData?.customerEmail} onChange={e => updateCustomerInfo('customerEmail', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" /></div>
                                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone</label><input value={editingOrderData?.customerPhone} onChange={e => updateCustomerInfo('customerPhone', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" /></div>
                              </div>
                              <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Street Address</label><input value={editingOrderData?.customerAddress} onChange={e => updateCustomerInfo('customerAddress', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none" /></div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">District</label><select value={editingOrderData?.customerDistrict} onChange={e => updateCustomerInfo('customerDistrict', e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none appearance-none"><option value="">Select District</option>{Object.keys(DISTRICT_AREA_DATA).map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                                <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Area</label><select value={editingOrderData?.customerArea} onChange={e => updateCustomerInfo('customerArea', e.target.value)} disabled={!editingOrderData?.customerDistrict} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none appearance-none disabled:opacity-50"><option value="">Select Area</option>{editingOrderData?.customerDistrict && DISTRICT_AREA_DATA[editingOrderData.customerDistrict].map(a => <option key={a} value={a}>{a}</option>)}</select></div>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="font-black text-gray-800">{viewingOrder.customerName}</p>
                              <p className="font-bold text-gray-500">{viewingOrder.customerEmail}</p>
                              <p className="font-bold text-gray-500">{viewingOrder.customerPhone}</p>
                              <p className="font-bold text-gray-500 pt-4 leading-relaxed">{viewingOrder.customerAddress}, {viewingOrder.customerArea}, {viewingOrder.customerDistrict}</p>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Order Summary</h4>
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-3 font-bold text-sm">
                          <div className="flex justify-between"><span>Subtotal</span><span className="text-gray-800 font-black">৳{(isEditingOrder ? editingOrderData?.subtotal : viewingOrder.subtotal)?.toFixed(2)}</span></div>
                          <div className="flex justify-between items-center"><span>Shipping Fee</span>{isEditingOrder ? (<div className="flex items-center gap-2"><span className="text-xs text-gray-400">৳</span><input type="number" className="w-24 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-right text-sm font-black text-[#1a3a34] focus:ring-1 focus:ring-emerald-500 outline-none" value={editingOrderData?.shippingCost} onChange={(e) => changeOrderShipping(parseFloat(e.target.value) || 0)} /></div>) : (<span className="text-gray-800 font-black">৳{viewingOrder.shippingCost.toFixed(2)}</span>)}</div>
                          <div className="flex justify-between text-emerald-600"><span className="flex items-center gap-1.5">{viewingOrder.coupon_code && <Ticket size={12} />} Discount {viewingOrder.coupon_code && `(${viewingOrder.coupon_code})`}</span><span className="font-black">-৳{(isEditingOrder ? editingOrderData?.discount : viewingOrder.discount)?.toFixed(2)}</span></div>
                          <div className="flex justify-between text-lg font-black pt-3 border-t border-gray-200"><span>Total</span><span className="text-emerald-600 text-xl font-black">৳{(isEditingOrder ? editingOrderData?.total : viewingOrder.total)?.toFixed(2)}</span></div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="flex justify-between items-center"><h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Package size={16} className="text-emerald-500" /> Items Purchased</h4>{isEditingOrder && (<div className="relative"><button onClick={() => setShowProductPicker(!showProductPicker)} className="flex items-center gap-2 bg-[#004d40] text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"><Plus size={14} /> Add Item</button>{showProductPicker && (<div className="absolute right-0 mt-3 w-96 bg-white border border-gray-200 rounded-[2rem] shadow-2xl p-6 z-[110] animate-in slide-in-from-top-2 duration-300"><div className="relative mb-5"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} /><input autoFocus placeholder="Search products..." className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-50 focus:bg-white focus:border-emerald-500 transition-all" value={orderProductSearch} onChange={(e) => setOrderProductSearch(e.target.value)} /></div><div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">{orderSearchFilteredProducts.map(p => (<div key={p.id} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 transition-all"><div className="flex justify-between items-center mb-3"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-white rounded-xl p-1 border border-gray-100 flex items-center justify-center"><img src={p.images?.[0] || ''} className="max-h-full max-w-full object-contain" /></div><span className="text-xs font-black text-gray-800 leading-tight">{p.name}</span></div><span className="text-[11px] font-black text-[#00a651] bg-white px-2 py-1 rounded-lg border border-emerald-50 shadow-sm">৳{p.price}</span></div>{p.variants && p.variants.length > 0 ? (<div className="flex flex-wrap gap-2">{p.variants.map(v => (<button key={v.id} onClick={() => addProductToOrder(p, v)} className="text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl border border-emerald-100 hover:bg-[#00a651] hover:text-white hover:border-[#00a651] transition-all">{Object.values(v.attributeValues).join(' / ')}</button>))}</div>) : (<button onClick={() => addProductToOrder(p)} className="w-full text-[9px] font-black uppercase tracking-widest bg-[#004d40] text-white py-2 rounded-xl hover:bg-black transition-all shadow-md active:scale-95">Add Piece</button>)}</div>))}{orderSearchFilteredProducts.length === 0 && orderProductSearch && (<div className="text-center py-10"><Search size={32} className="mx-auto text-gray-200 mb-2" /><p className="text-xs font-bold text-gray-400 italic">No products matched "{orderProductSearch}"</p></div>)}</div></div>)}</div>)}</div>
                      <div className="space-y-3">{(isEditingOrder ? editingOrderData?.items : viewingOrder.items)?.map((item, idx) => (<div key={idx} className="flex justify-between items-center p-5 bg-gray-50/50 rounded-[2rem] border border-gray-50 group hover:bg-emerald-50/30 transition-all duration-300"><div className="flex items-center gap-5"><div className="w-14 h-14 bg-white rounded-2xl p-2 flex items-center justify-center border border-gray-100 shadow-sm overflow-hidden group-hover:scale-105 transition-transform"><img src={item.selectedVariantImage || item.images?.[0] || ''} className="max-h-full max-w-full object-contain" /></div><div><p className="font-black text-gray-800 text-[15px] leading-tight mb-1">{item.name}</p>{item.selectedVariantName && (<p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest inline-block bg-white px-2 py-0.5 rounded-lg border border-emerald-50">{item.selectedVariantName}</p>)}</div></div><div className="flex items-center gap-10"><div className="flex items-center gap-5">{isEditingOrder ? (<div className="flex items-center bg-white border border-gray-200 rounded-2xl p-1 shadow-sm ring-4 ring-gray-100"><button onClick={() => changeOrderItemQty(idx, -1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"><Minus size={14} /></button><span className="w-8 text-center text-sm font-black text-[#1a3a34]">{item.quantity}</span><button onClick={() => changeOrderItemQty(idx, 1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-emerald-500 transition-colors"><Plus size={14} /></button></div>) : (<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Qty: <span className="text-gray-700 text-sm ml-1">{item.quantity}</span></p>)}</div><div className="text-right min-w-[120px]"><div className="text-base font-black text-[#1a3a34]">৳{(item.price * item.quantity).toFixed(2)}</div><div className="text-[10px] font-bold text-gray-400">৳{item.price.toFixed(2)} / unit</div></div>{isEditingOrder && (<button onClick={() => removeOrderItem(idx)} className="w-10 h-10 flex items-center justify-center bg-white text-gray-300 hover:text-red-500 hover:bg-red-50 border border-gray-100 rounded-2xl transition-all shadow-sm active:scale-90"><Trash2 size={18} /></button>)}</div></div>))}</div>
                    </div>
                    {isEditingOrder && (<div className="pt-12 flex gap-5 border-t border-gray-50"><button onClick={closeForms} className="flex-1 bg-gray-50 text-gray-400 font-black py-5 rounded-[1.2rem] uppercase text-xs tracking-widest hover:bg-gray-100 transition-all active:scale-95">Discard Changes</button><button onClick={saveOrderEdits} className="flex-[2] bg-[#00a651] text-white font-black py-5 rounded-[1.2rem] uppercase text-xs tracking-widest shadow-xl shadow-emerald-100 hover:bg-[#008c44] transition-all flex items-center justify-center gap-3 active:scale-[0.98]"><Check size={20} /> Update Order</button></div>)}
                  </div>
                </div>
              )}
            </div>
          )
        }

        {/* Coupons Tab */}
        {
          adminTab === 'coupons' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Promo Coupons</h2><p className="text-slate-400 text-sm">Create and manage marketing discount codes.</p></div>
                <button onClick={() => setIsAdding('coupon')} className="bg-[#00a651] text-white px-8 py-3.5 rounded-xl font-black uppercase text-[11px] flex items-center gap-2 shadow-xl"><Plus size={18} /> Add Coupon</button>
              </div>
              {(isAdding === 'coupon' || editingItem?.type === 'coupon') && (
                <form onSubmit={handleCouponSubmit} className="bg-white rounded-2xl border border-emerald-100 p-8 shadow-xl space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Coupon Code</label><input required value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Discount Type</label><select value={couponForm.discountType} onChange={e => setCouponForm({ ...couponForm, discountType: e.target.value as any })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold"><option value="Fixed">Fixed Amount</option><option value="Percentage">Percentage %</option></select></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Value</label><input required type="number" value={couponForm.discountValue} onChange={e => setCouponForm({ ...couponForm, discountValue: parseFloat(e.target.value) })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Min Spend</label><input required type="number" value={couponForm.minimumSpend} onChange={e => setCouponForm({ ...couponForm, minimumSpend: parseFloat(e.target.value) })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Expiry Date</label><input required type="date" value={couponForm.expiryDate} onChange={e => setCouponForm({ ...couponForm, expiryDate: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold" /></div>
                    <div className="space-y-2 flex items-center pt-6 ml-4"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={couponForm.autoApply} onChange={e => setCouponForm({ ...couponForm, autoApply: e.target.checked })} className="w-5 h-5 accent-emerald-500" /><span className="text-xs font-black text-gray-500 uppercase">Auto-Apply</span></label></div>
                  </div>
                  <div className="flex justify-end gap-3"><button type="button" onClick={closeForms} className="px-6 py-3 text-slate-400 font-bold uppercase text-[11px]">Cancel</button><button type="submit" className="bg-emerald-600 text-white px-10 py-3 rounded-xl font-black uppercase text-[11px]">Save Coupon</button></div>
                </form>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map(cp => (
                  <div key={cp.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 group-hover:bg-emerald-500/10 transition-colors"></div>
                    <div className="relative space-y-4">
                      <div className="flex justify-between items-center"><span className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-black tracking-widest">{cp.code}</span><div className="flex gap-2"><button onClick={() => { setEditingItem({ type: 'coupon', data: cp }); setCouponForm(cp); }} className="text-gray-300 hover:text-blue-500"><Pencil size={16} /></button><button onClick={() => deleteCoupon(cp.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={16} /></button></div></div>
                      <div className="space-y-1"><p className="font-black text-2xl text-gray-800">{cp.discountType === 'Fixed' ? `৳${cp.discountValue}` : `${cp.discountValue}%`} OFF</p><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Min Spend: ৳{cp.minimumSpend}</p></div>
                      <div className="pt-4 border-t flex items-center gap-2 text-xs font-bold text-gray-400"><RefreshCw size={14} /> Expires: {new Date(cp.expiryDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        }

        {/* Reviews Tab */}
        {
          adminTab === 'reviews' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Customer Reviews</h2><p className="text-slate-400 text-sm">Moderate and respond to customer feedback.</p></div>
              <div className="space-y-6">
                {reviews.map(review => (
                  <div key={review.id} className="bg-white rounded-[2rem] border border-gray-100 p-8 space-y-6 group">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4"><div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-black text-xl">{review.authorName.charAt(0)}</div><div><h4 className="font-black text-gray-800">{review.authorName}</h4><span className="text-[10px] font-black text-gray-400 uppercase">{review.productName} • {new Date(review.createdAt).toLocaleDateString()}</span></div></div>
                      <div className="flex items-center gap-4"><div className="flex text-yellow-400 gap-0.5">{[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill={i <= review.rating ? "currentColor" : "none"} className={i <= review.rating ? "" : "text-gray-200"} />)}</div><button onClick={() => deleteReview(review.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18} /></button></div>
                    </div>
                    <p className="text-gray-600 text-[15px] leading-relaxed italic">"{review.comment}"</p>
                    {review.reply ? (
                      <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100"><span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-2">Merchant Response</span><p className="text-gray-800 text-sm font-bold">"{review.reply}"</p><button onClick={() => setReplyingTo(review.id)} className="text-[10px] font-black text-emerald-500 uppercase mt-4 hover:underline">Edit Response</button></div>
                    ) : (
                      <button onClick={() => setReplyingTo(review.id)} className="bg-gray-50 hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-gray-100 transition-all">Reply to Review</button>
                    )}
                  </div>
                ))}
              </div>
              {replyingTo && (
                <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
                  <form onSubmit={handleReplySubmit} className="bg-white rounded-[2rem] w-full max-w-lg p-10 shadow-2xl space-y-6 animate-in zoom-in-95">
                    <div className="flex justify-between items-center"><h3 className="text-xl font-black text-gray-800 uppercase tracking-widest">Merchant Reply</h3><button type="button" onClick={() => setReplyingTo(null)} className="text-gray-300 hover:text-red-500"><X size={24} /></button></div>
                    <textarea value={replyText} onChange={e => setReplyText(e.target.value)} required placeholder="Write your response here..." className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-6 h-48 text-sm font-medium outline-none focus:border-emerald-500 transition-all" />
                    <div className="flex gap-4"><button type="button" onClick={() => setReplyingTo(null)} className="flex-1 bg-gray-50 text-gray-400 font-black py-4 rounded-xl text-xs uppercase">Cancel</button><button type="submit" className="flex-1 bg-emerald-500 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest shadow-lg">Submit Reply</button></div>
                  </form>
                </div>
              )}
            </div>
          )
        }

        {/* Users Tab */}
        {
          adminTab === 'users' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Registered Users</h2><p className="text-slate-400 text-sm">Manage user accounts and permission roles.</p></div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b text-[10px] uppercase font-black text-slate-400 tracking-widest">
                    <tr><th className="px-8 py-6">User</th><th className="px-6 py-6">Role</th><th className="px-6 py-6">Registered On</th><th className="px-8 py-6 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5 flex items-center gap-4"><div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-black text-lg">{u.email.charAt(0).toUpperCase()}</div><div className="flex flex-col"><span className="font-bold text-gray-800">{u.full_name || 'Anonymous User'}</span><span className="text-xs text-gray-400">{u.email}</span></div></td>
                        <td className="px-6 py-5"><span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${u.role === 'admin' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>{u.role}</span></td>
                        <td className="px-6 py-5 text-gray-400 font-bold text-sm">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="px-8 py-5 text-right"><button onClick={() => updateUserRole(u.id, u.role === 'admin' ? 'customer' : 'admin')} className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:underline">{u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        }

        {/* System Settings Tab */}
        {
          adminTab === 'settings' && (
            <div className="max-w-3xl space-y-8 animate-in fade-in duration-500">
              <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">System Settings</h2><p className="text-slate-400 text-sm">Configure store-wide parameters and shipping fees.</p></div>
              <div className="bg-white rounded-[2rem] border border-gray-100 p-10 space-y-10 shadow-sm">
                <div className="space-y-8">
                  <h3 className="text-lg font-black text-gray-800 uppercase tracking-widest flex items-center gap-3"><Truck className="text-emerald-500" /> Delivery Fees Configuration</h3>
                  <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Inside Dhaka (৳)</label><input type="number" value={shipForm.insideDhaka} onChange={e => setShipForm({ ...shipForm, insideDhaka: parseFloat(e.target.value) })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:bg-white focus:border-emerald-500 transition-all" /></div>
                    <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Outside Dhaka (৳)</label><input type="number" value={shipForm.outsideDhaka} onChange={e => setShipForm({ ...shipForm, outsideDhaka: parseFloat(e.target.value) })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:bg-white focus:border-emerald-500 transition-all" /></div>
                  </div>
                </div>
                <div className="pt-6 border-t flex justify-end"><button onClick={() => updateShippingSettings(shipForm)} className="bg-emerald-600 text-white font-black px-12 py-4 rounded-2xl uppercase tracking-widest text-[11px] shadow-lg shadow-emerald-50 hover:bg-emerald-700 transition-all">Save Changes</button></div>
              </div>

              <div className="bg-white rounded-[2rem] border border-gray-100 p-10 space-y-10 shadow-sm">
                <div className="space-y-8">
                  <h3 className="text-lg font-black text-gray-800 uppercase tracking-widest flex items-center gap-3"><Globe className="text-blue-500" /> Store Identity</h3>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Store Name</label><input value={storeForm.name} onChange={e => setStoreForm({ ...storeForm, name: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-blue-500 transition-all" /></div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Store Logo</label>
                      <div className="flex items-center gap-4">
                        {storeForm.logo_url && <img src={storeForm.logo_url} alt="Logo" className="w-12 h-12 object-contain bg-gray-50 rounded-lg p-1 border border-gray-100" />}
                        <label className="cursor-pointer bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-blue-500 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border border-gray-100 transition-all flex items-center gap-2">
                          <ImageIcon size={16} /> Upload Logo
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Address</label><input value={storeForm.address} onChange={e => setStoreForm({ ...storeForm, address: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-blue-500 transition-all" /></div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone</label><input value={storeForm.phone} onChange={e => setStoreForm({ ...storeForm, phone: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-blue-500 transition-all" /></div>
                    <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label><input value={storeForm.email} onChange={e => setStoreForm({ ...storeForm, email: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-blue-500 transition-all" /></div>
                  </div>

                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mt-6">Social Media</h4>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Facebook URL</label><input value={storeForm.socials?.facebook || ''} onChange={e => setStoreForm({ ...storeForm, socials: { ...storeForm.socials, facebook: e.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-blue-500 transition-all" placeholder="https://facebook.com/..." /></div>
                    <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Instagram URL</label><input value={storeForm.socials?.instagram || ''} onChange={e => setStoreForm({ ...storeForm, socials: { ...storeForm.socials, instagram: e.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-blue-500 transition-all" placeholder="https://instagram.com/..." /></div>
                  </div>

                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mt-6">Floating Contact Widget</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={storeForm.floatingWidget?.isVisible ?? true} onChange={e => setStoreForm({ ...storeForm, floatingWidget: { ...(storeForm.floatingWidget || {}), isVisible: e.target.checked } })} className="w-5 h-5 accent-emerald-500" />
                        <span className="text-sm font-bold text-gray-700">Enable Widget</span>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Support Agent Image</label>
                      <div className="flex items-center gap-4">
                        {storeForm.floatingWidget?.supportImage && <img src={storeForm.floatingWidget.supportImage} className="w-12 h-12 object-cover rounded-full border border-gray-100" />}
                        <label className="cursor-pointer bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-emerald-500 px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest border border-gray-100 transition-all flex items-center gap-2">
                          <ImageIcon size={16} /> Upload Image
                          <input type="file" accept="image/*" onChange={handleSupportImageUpload} className="hidden" />
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp Number</label><input value={storeForm.floatingWidget?.whatsapp || ''} onChange={e => setStoreForm({ ...storeForm, floatingWidget: { ...(storeForm.floatingWidget || {}), whatsapp: e.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-emerald-500 transition-all" placeholder="e.g. 88017..." /></div>
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Messenger Username/ID</label><input value={storeForm.floatingWidget?.messenger || ''} onChange={e => setStoreForm({ ...storeForm, floatingWidget: { ...(storeForm.floatingWidget || {}), messenger: e.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-emerald-500 transition-all" placeholder="e.g. username" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Facebook Link</label><input value={storeForm.floatingWidget?.facebook || ''} onChange={e => setStoreForm({ ...storeForm, floatingWidget: { ...(storeForm.floatingWidget || {}), facebook: e.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-emerald-500 transition-all" placeholder="https://facebook.com/..." /></div>
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Instagram Link</label><input value={storeForm.floatingWidget?.instagram || ''} onChange={e => setStoreForm({ ...storeForm, floatingWidget: { ...(storeForm.floatingWidget || {}), instagram: e.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-emerald-500 transition-all" placeholder="https://instagram.com/..." /></div>
                    </div>
                    <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Support Phone</label><input value={storeForm.floatingWidget?.phone || ''} onChange={e => setStoreForm({ ...storeForm, floatingWidget: { ...(storeForm.floatingWidget || {}), phone: e.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-emerald-500 transition-all" placeholder="e.g. +8801..." /></div>
                  </div>

                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mt-6">Footer Settings</h4>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Footer Description</label>
                      <textarea value={storeForm.footer_description || ''} onChange={e => setStoreForm({ ...storeForm, footer_description: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-blue-500 transition-all min-h-[100px]" placeholder="Brief description about your store..." />
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">iOS App Link</label><input value={storeForm.app_links?.ios || ''} onChange={e => setStoreForm({ ...storeForm, app_links: { ...storeForm.app_links, ios: e.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-blue-500 transition-all" placeholder="App Store URL" /></div>
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Android App Link</label><input value={storeForm.app_links?.android || ''} onChange={e => setStoreForm({ ...storeForm, app_links: { ...storeForm.app_links, android: e.target.value } })} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-blue-500 transition-all" placeholder="Play Store URL" /></div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Company Quick Links</label>
                      {storeForm.footer_links?.map((link, idx) => (
                        <div key={idx} className="flex gap-4">
                          <input value={link.label} onChange={e => {
                            const newLinks = [...(storeForm.footer_links || [])];
                            newLinks[idx] = { ...newLinks[idx], label: e.target.value };
                            setStoreForm({ ...storeForm, footer_links: newLinks });
                          }} className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none" placeholder="Label" />
                          <input value={link.url} onChange={e => {
                            const newLinks = [...(storeForm.footer_links || [])];
                            newLinks[idx] = { ...newLinks[idx], url: e.target.value };
                            setStoreForm({ ...storeForm, footer_links: newLinks });
                          }} className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none" placeholder="URL" />
                          <button onClick={() => setStoreForm({ ...storeForm, footer_links: storeForm.footer_links?.filter((_, i) => i !== idx) })} className="text-red-400 hover:text-red-500 bg-red-50 p-3 rounded-xl"><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => setStoreForm({ ...storeForm, footer_links: [...(storeForm.footer_links || []), { label: '', url: '' }] })} className="w-full py-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-gray-500 font-bold text-xs uppercase tracking-widest hover:bg-white hover:border-blue-200 hover:text-blue-500 transition-all flex items-center justify-center gap-2"><Plus size={14} /> Add Link</button>
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t flex justify-end"><button onClick={() => updateStoreInfo(storeForm)} className="bg-blue-600 text-white font-black px-12 py-4 rounded-2xl uppercase tracking-widest text-[11px] shadow-lg shadow-blue-50 hover:bg-blue-700 transition-all">Update Identity</button></div>
              </div>

              <div className="bg-amber-50 rounded-[2rem] border border-amber-100 p-10 flex items-start gap-6"><div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm shrink-0"><AlertTriangle /></div><div><h4 className="font-black text-amber-800 uppercase text-sm tracking-widest mb-2">Technical Warning</h4><p className="text-sm text-amber-700/80 leading-relaxed font-medium">Changing shipping settings affects all active checkouts instantly.</p></div></div>
            </div>
          )
        }

        {/* Database Schema Tab */}
        {
          adminTab === 'database' && (
            <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
              <div className="flex justify-between items-center">
                <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Supabase SQL Schema</h2><p className="text-slate-400 text-sm">Copy and paste this script into your Supabase SQL Editor.</p></div>
                <button onClick={handleCopySchema} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase text-[11px] transition-all shadow-lg active:scale-95 ${copySuccess ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white hover:bg-black'}`}>{copySuccess ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy SQL Script</>}</button>
              </div>
              <div className="relative group"><div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div><div className="relative bg-[#0f172a] rounded-[2rem] overflow-hidden shadow-2xl border border-slate-800"><div className="flex items-center justify-between px-8 py-4 bg-slate-900 border-b border-slate-800"><div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-amber-500"></div><div className="w-3 h-3 rounded-full bg-emerald-500"></div></div><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Supabase Setup Script</span></div><pre className="p-10 text-emerald-400 font-mono text-sm leading-relaxed overflow-x-auto max-h-[600px] custom-scrollbar">{SQL_SCHEMA}</pre></div></div>
            </div>
          )
        }
      </main >
    </div >
  );
};

export default Admin;
