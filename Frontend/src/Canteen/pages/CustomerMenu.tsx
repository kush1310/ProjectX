
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { 
  fetchMenu,
  getCategories, 
  MenuItem, 
  Category
} from '../utils/canteenStore';
import { Icons } from '@/components/Icons';
import { PlaceholdersAndVanishInput } from '@/components/ui/placeholders-and-vanish-input';

// Reuse dietary tags


export default function CustomerMenuPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    const loadData = async () => {
      // Default to ID 1 if accessing via /customer/menu (MVP single canteen)
      const canteenId = id ? Number(id) : 1;
      
      setLoading(true);
      
      const startTime = Date.now();
      
      try {
        const [menuData, categoriesData] = await Promise.all([
          fetchMenu(canteenId),
          getCategories(canteenId)
        ]);
        
        // Ensure minimum 1.5s loading time for skeleton as requested
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 1500 - elapsed);
        
        setTimeout(() => {
          setItems(menuData);
          setCategories(categoriesData);
          setLoading(false);
        }, remaining);
        
      } catch (error) {
        console.error("Failed to load menu", error);
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      // Only show available items to customers
      return matchesSearch && matchesCategory && item.isAvailable !== false;
    });
  }, [items, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/customer/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2 group"
            >
              <Icons.ChevronLeft className="w-6 h-6 text-gray-700 group-hover:text-brand-600" />
              <span className="hidden sm:inline text-sm font-bold text-gray-600 group-hover:text-brand-600">Back</span>
            </button>
            <div>
               <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Canteen Menu</h1>
               <p className="text-xs text-gray-500 font-medium">Order fresh & hot food</p>
            </div>
          </div>
          
          <div className="hidden sm:block w-96">
            <PlaceholdersAndVanishInput
              placeholders={["Search for 'Paneer Tikka'...", "Find Beverages...", "Hungry for Thali?"]}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSubmit={(e) => e.preventDefault()}
            />
          </div>
        </div>
      </header>

      {/* Categories Sticky Bar */}
      <div className="bg-white border-b border-gray-100 sticky top-[73px] z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 overflow-x-auto no-scrollbar">
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-5 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all border ${
                selectedCategory === 'All'
                  ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-5 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all border ${
                  selectedCategory === cat.name
                    ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-32">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-0 overflow-hidden border border-gray-100 shadow-sm h-[320px] flex flex-col">
                <Skeleton height={180} className="w-full" />
                <div className="p-4 flex-1 flex flex-col justify-between">
                   <div>
                      <Skeleton width="60%" height={20} className="mb-2" />
                      <Skeleton count={2} height={12} />
                   </div>
                   <div className="flex justify-between items-center mt-4">
                      <Skeleton width={60} height={24} />
                      <Skeleton width={80} height={36} borderRadius={8} />
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
             <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-4xl">
               🔍
             </div>
             <h3 className="text-xl font-bold text-gray-900 mb-2">No items found</h3>
             <p className="text-gray-500">We couldn't find anything matching "{searchQuery}"</p>
             <div className="flex flex-col gap-2 mt-6">
               <button 
                 onClick={() => {setSearchQuery(''); setSelectedCategory('All');}}
                 className="text-rose-500 font-bold hover:underline"
               >
                 Clear filters
               </button>
               <button 
                  onClick={() => {
                    localStorage.removeItem('charusatneeds_session');
                    document.cookie = 'charusatneeds_auth=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
                    window.location.href = '/login';
                  }}
                  className="text-gray-400 text-xs hover:text-gray-600 underline"
               >
                 Force Logout
               </button>
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 kiosk:grid-cols-5 tv:grid-cols-6 gap-6">
            {filteredItems.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full"
              >
                {/* Image Section */}
                <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Veg/Non-Veg Indicator */}
                   <div className="absolute top-3 right-3 bg-white/95 backdrop-blur px-2 py-1 rounded-md shadow-sm border border-gray-100 flex items-center gap-1.5 z-10">
                      <span className={`w-2.5 h-2.5 border ${item.isVegetarian ? 'border-green-600' : 'border-red-600'} flex items-center justify-center p-[1px]`}>
                         <span className={`w-full h-full rounded-full ${item.isVegetarian ? 'bg-green-600' : 'bg-red-600'}`}></span>
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${item.isVegetarian ? 'text-green-700' : 'text-red-700'}`}>
                         {item.isVegetarian ? 'Veg' : 'Non-Veg'}
                      </span>
                   </div>
                   
                   {/* Best Seller Badge */}
                   {item.isRecommended && (
                     <div className="absolute top-3 left-3 bg-amber-400 text-white px-2 py-1 rounded-md shadow-lg text-[10px] font-bold uppercase tracking-wide z-10">
                        Bestseller
                     </div>
                   )}
                </div>
                
                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-gray-900 leading-tight group-hover:text-rose-600 transition-colors">
                        {item.name}
                      </h3>
                      <span className="text-[10px] items-center bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-bold uppercase tracking-wide ml-2 whitespace-nowrap">
                         {item.category}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4">
                      {item.description || "Freshly prepared with authentic ingredients."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                     <span className="text-xl font-bold text-gray-900">
                        ₹{item.price}
                     </span>

                    <button className="bg-rose-50 text-rose-600 border border-rose-100 px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-rose-600 hover:text-white hover:shadow-lg hover:border-rose-600 transition-all active:scale-95 flex items-center gap-2">
                       ADD
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                       </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
