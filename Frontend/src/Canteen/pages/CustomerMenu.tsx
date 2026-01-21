
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { 
  fetchMenu,
  getCategories, 
  MenuItem, 
  Category,
  DietaryInfo 
} from '../utils/canteenStore';
import { Icons } from '@/components/Icons';

// Reuse dietary tags
const DIETARY_TAGS: { key: keyof DietaryInfo; label: string; icon: string; color: string }[] = [
  { key: 'vegetarian', label: 'Vegetarian', icon: 'Veg', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { key: 'vegan', label: 'Vegan', icon: 'Vegan', color: 'bg-green-50 text-green-700 border-green-200' },
  { key: 'glutenFree', label: 'Gluten-Free', icon: 'GF', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'spicy', label: 'Spicy', icon: 'Hot', color: 'bg-red-50 text-red-700 border-red-200' },
  { key: 'containsNuts', label: 'Contains Nuts', icon: 'Nuts', color: 'bg-orange-50 text-orange-700 border-orange-200' },
];

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
      if (!id) return;
      setLoading(true);
      const menuData = await fetchMenu(Number(id));
      setItems(menuData);
      setCategories(getCategories());
      setLoading(false);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Icons.ChevronLeft />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Food Menu</h1>
          </div>
          
          <div className="relative hidden sm:block">
            <input
              type="text"
              placeholder="Search food..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </div>
          </div>
        </div>
      </header>

      {/* Categories */}
      <div className="bg-white border-b border-gray-100 sticky top-[73px] z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 overflow-x-auto no-scrollbar">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                selectedCategory === 'All'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.name
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100">
                <Skeleton height={140} className="rounded-xl mb-3" />
                <Skeleton count={2} />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">No items found matching your selection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-emerald-200 transition-all group"
              >
                <div className="aspect-[4/3] bg-gray-100 relative">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
                  )}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg font-bold text-emerald-600 text-sm shadow-sm">
                    ₹{item.price}
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{item.category}</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3 h-10">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between mt-4">
                     {/* Dietary Tags */}
                    <div className="flex gap-1">
                      {DIETARY_TAGS.filter(tag => item.dietary && item.dietary[tag.key]).slice(0, 2).map(tag => (
                        <div key={tag.key} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] border ${tag.color}`} title={tag.label}>
                          {tag.icon}
                        </div>
                      ))}
                    </div>

                    <button className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-600 hover:text-white transition-colors">
                      Add +
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
