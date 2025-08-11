import React, { useState, useRef, useEffect } from 'react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const MultiSelect = ({ 
  data = [], 
  value = [], 
  onChange, 
  placeholder = "Select items...", 
  searchable = false,
  error,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

  // Filter data based on search query
  const filteredData = searchable 
    ? data.filter(item => 
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : data;

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSelection = (item) => {
    const newValue = value.includes(item.value)
      ? value.filter(v => v !== item.value)
      : [...value, item.value];
    onChange(newValue);
  };

  const removeItem = (itemValue) => {
    onChange(value.filter(v => v !== itemValue));
  };

  const getSelectedLabels = () => {
    return value
      .map(v => data.find(item => item.value === v)?.label)
      .filter(Boolean);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        className={cn(
          "flex min-h-20 w-full flex-wrap gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          error && "border-destructive focus-within:ring-destructive",
          isOpen && "ring-2 ring-ring ring-offset-2"
        )}
      >
        {value.length === 0 && (
          <div className="flex h-6 items-center text-muted-foreground">
            {placeholder}
          </div>
        )}
        
        {value.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {getSelectedLabels().map((label, index) => (
              <Badge
                key={`${label}-${index}`}
                variant="secondary"
                className="gap-1 pr-1"
              >
                <span className="text-xs">{label.replace(/ \([^)]+\)$/, '')}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-3 w-3 p-0 hover:bg-transparent"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(value[index]);
                  }}
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6 p-0"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </Button>
      </div>

      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}

      {isOpen && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
          {searchable && (
            <div className="p-2">
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8"
              />
            </div>
          )}
          
          <div className="max-h-60 overflow-y-auto">
            <div className="p-1">
              {filteredData.length === 0 ? (
                <div className="py-2 px-2 text-sm text-muted-foreground">
                  No items found
                </div>
              ) : (
                filteredData.map((item) => {
                  const isSelected = value.includes(item.value);
                  return (
                    <div
                      key={item.value}
                      className={cn(
                        "flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
                        isSelected && "bg-accent text-accent-foreground"
                      )}
                      onClick={() => toggleSelection(item)}
                    >
                      <span>{item.label}</span>
                      {isSelected && <Check className="h-4 w-4" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;