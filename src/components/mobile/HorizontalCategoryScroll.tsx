import { Scissors, Palette, Sparkles, Heart, Star } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
}

interface HorizontalCategoryScrollProps {
  onCategorySelect?: (categoryId: string) => void;
  activeCategory?: string;
  categories?: Category[];
}

const defaultCategories: Category[] = [
  { id: 'haircut', name: 'Haircut', icon: Scissors, color: '#FF5A5F' },
  { id: 'coloring', name: 'Coloring', icon: Palette, color: '#8B5CF6' },
  { id: 'spa', name: 'Spa', icon: Sparkles, color: '#06B6D4' },
  { id: 'makeup', name: 'Makeup', icon: Heart, color: '#EC4899' },
  { id: 'styling', name: 'Styling', icon: Star, color: '#F59E0B' },
];

export function HorizontalCategoryScroll({ 
  onCategorySelect, 
  activeCategory,
  categories = defaultCategories 
}: HorizontalCategoryScrollProps) {
  return (
    <section className="horizontal-scroll-section">
      <div className="horizontal-scroll-header">
        <h2 className="horizontal-scroll-title">Categories</h2>
        <button className="horizontal-scroll-see-all">See All</button>
      </div>
      
      <div className="horizontal-scroll-container">
        <div className="horizontal-scroll-track">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => onCategorySelect?.(category.id)}
                className={`category-pill ${isActive ? 'category-pill--active' : ''}`}
                style={{
                  '--category-color': category.color,
                  '--category-color-light': `${category.color}20`,
                } as React.CSSProperties}
              >
                <div 
                  className="category-icon-wrapper"
                  style={{ backgroundColor: isActive ? category.color : `${category.color}15` }}
                >
                  <Icon 
                    className="category-icon" 
                    style={{ color: isActive ? 'white' : category.color }}
                    size={20}
                  />
                </div>
                <span className="category-name">{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

