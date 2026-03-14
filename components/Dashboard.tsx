import React, { useState } from 'react';
import { Grid, Heart, Clock, Shirt, Trash2, LayoutGrid, List, Sparkles } from 'lucide-react';
import { ClothingItem } from '../types';

interface Props {
  items: ClothingItem[];
  favorites: string[];
  history: string[];
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onSelectItem?: (item: ClothingItem) => void;
}

const Dashboard: React.FC<Props> = ({ items, favorites, history, onToggleFavorite, onDelete, onSelectItem }) => {
  const [activeTab, setActiveTab] = useState<'wardrobe' | 'favorites' | 'history'>('wardrobe');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredItems = items.filter(item => {
    if (activeTab === 'favorites') return favorites.includes(item.id);
    if (activeTab === 'history') return item.category === 'Virtual Try-On';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl serif text-white">Your Atelier</h1>
          <p className="text-neutral-400">Curation of your favorite styles and fits.</p>
        </div>
        
        <div className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-800">
          <button 
            onClick={() => setActiveTab('wardrobe')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all ${activeTab === 'wardrobe' ? 'bg-rose-gold text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            <Shirt className="w-4 h-4" /> Wardrobe
          </button>
          <button 
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all ${activeTab === 'favorites' ? 'bg-rose-gold text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            <Heart className="w-4 h-4" /> Favorites
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all ${activeTab === 'history' ? 'bg-rose-gold text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            <Clock className="w-4 h-4" /> History
          </button>
        </div>
      </header>

      <div className="flex justify-between items-center pb-4 border-b border-neutral-800/50">
        <h3 className="text-rose-gold font-light tracking-widest uppercase text-sm">
          {activeTab} • {filteredItems.length} Items
        </h3>
        <div className="flex gap-2 text-neutral-500">
          <LayoutGrid 
            className={`w-5 h-5 cursor-pointer ${viewMode === 'grid' ? 'text-rose-gold' : ''}`} 
            onClick={() => setViewMode('grid')} 
          />
          <List 
            className={`w-5 h-5 cursor-pointer ${viewMode === 'list' ? 'text-rose-gold' : ''}`} 
            onClick={() => setViewMode('list')} 
          />
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center opacity-40 text-center">
          <Sparkles className="w-12 h-12 text-rose-gold mb-4" />
          <h4 className="serif text-xl text-white">Your {activeTab} is empty</h4>
          <p className="text-sm font-light">Create something beautiful in the Studio to see it here.</p>
        </div>
      ) : (
        <div className={`grid gap-8 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'}`}>
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              onClick={() => onSelectItem?.(item)}
              className={`group glass rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-rose-gold/10 cursor-pointer ${viewMode === 'list' ? 'flex gap-8 items-center p-4' : ''}`}
            >
              <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-48 aspect-square' : 'aspect-[3/4]'}`}>
                <img 
                  src={item.imageUrl} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  alt={item.name} 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button 
                    onClick={() => onToggleFavorite(item.id)}
                    className={`p-3 rounded-full transition-transform hover:scale-110 ${favorites.includes(item.id) ? 'bg-rose-gold text-white' : 'bg-white/20 text-white'}`}
                  >
                    <Heart className={`w-5 h-5 ${favorites.includes(item.id) ? 'fill-current' : ''}`} />
                  </button>
                  <button 
                    onClick={() => onDelete(item.id)}
                    className="p-3 bg-neutral-900 text-white rounded-full hover:scale-110 transition-transform"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className={`p-6 space-y-2 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                <div className="flex justify-between items-start">
                  <p className="text-xs text-rose-gold font-light tracking-widest uppercase">{item.category}</p>
                  {favorites.includes(item.id) && <Heart className="w-3 h-3 text-rose-gold fill-current" />}
                </div>
                <h4 className="text-xl serif text-white">{item.name}</h4>
                <p className="text-neutral-500 text-sm font-medium">{item.price}</p>
                {viewMode === 'list' && (
                  <p className="text-neutral-400 text-sm pt-4 border-t border-neutral-800">
                    Premium digital curation. Reflecting your unique style preferences and virtual fitting history.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;