import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Building,
  Grid3X3,
  List,
  Building2
} from 'lucide-react';
import { getTenantId, isValidDomain, extractDomain } from './TenantLookup';
import { generateAllPortalLinks } from './PortalLinkGenerator';
import TenantSearchCard from './components/TenantSearchCard';
import PortalFilters from './components/PortalFilters';
import PortalCard from './components/PortalCard';
import PortalTable from './components/PortalTable';
import EmptyState from './components/EmptyState';
import SEOHead from '../../common/SEOHead';
import ToolHeader from '../../common/ToolHeader';
import MicrosoftPortalsIcon from './MicrosoftPortalsIcon';
import { generateToolSEO } from '../../../utils/seoUtils';
import toolsConfig from '../../../utils/toolsConfig.json';

const MicrosoftPortalsShadcn = () => {
  // Get tool configuration for SEO
  const toolConfig = toolsConfig.find(tool => tool.id === 'microsoft-portals');
  const seoData = generateToolSEO(toolConfig);

  const [searchInput, setSearchInput] = useState('');
  const [tenantInfo, setTenantInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [portalLinks, setPortalLinks] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [domainToRemove, setDomainToRemove] = useState(null);
  const [manualSearchTriggered, setManualSearchTriggered] = useState(false);

  // Get domain from URL parameters
  const { domain: urlDomain } = useParams();

  // Local storage for lookup history
  const [lookupHistory, setLookupHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('microsoft-portals-history') || '[]');
    } catch {
      return [];
    }
  });

  // Cache for tenant lookups
  const [tenantCache, setTenantCache] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('microsoft-portals-cache') || '{}');
    } catch {
      return {};
    }
  });

  // Favorites storage
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('microsoft-portals-favorites') || '[]');
    } catch {
      return [];
    }
  });

  // Ref to prevent rapid multiple calls
  const toggleInProgress = useRef(false);

  // Initialize from localStorage after component mounts
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Cache duration (10 minutes)
  const CACHE_DURATION = 10 * 60 * 1000;

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('microsoft-portals-history', JSON.stringify(lookupHistory));
  }, [lookupHistory]);

  useEffect(() => {
    localStorage.setItem('microsoft-portals-cache', JSON.stringify(tenantCache));
  }, [tenantCache]);

  useEffect(() => {
    localStorage.setItem('microsoft-portals-favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Helper function to check if cached data is still valid
  const isCacheValid = (cachedData) => {
    if (!cachedData || !cachedData.timestamp) return false;
    return (Date.now() - cachedData.timestamp) < CACHE_DURATION;
  };

  // Add lookup to history
  const addToHistory = (domain, tenantData) => {
    const historyItem = {
      domain,
      tenantId: tenantData.tenantId,
      timestamp: Date.now()
    };

    setLookupHistory(prev => {
      const filtered = prev.filter(item => item.domain !== domain);
      return [historyItem, ...filtered].slice(0, 10);
    });
  };

  // Remove domain from history
  const removeDomainFromHistory = (domainToRemove) => {
    setLookupHistory(prev => prev.filter(item => item.domain !== domainToRemove));
    setRemoveModalOpen(false);
    setDomainToRemove(null);
    toast.success(`${domainToRemove} removed from recent domains`);
  };

  // Cache tenant data
  const cacheTenantData = (domain, data) => {
    setTenantCache(prev => ({
      ...prev,
      [domain]: {
        ...data,
        timestamp: Date.now()
      }
    }));
  };

  // Effect to handle URL domain parameter
  useEffect(() => {
    if (urlDomain && urlDomain.trim()) {
      const decodedDomain = decodeURIComponent(urlDomain);
      setSearchInput(decodedDomain);
      handleDomainLookup(decodedDomain);
    }
  }, [urlDomain]);

  // Perform tenant lookup
  const handleDomainLookup = async (domainToLookup) => {
    const domain = extractDomain(domainToLookup || searchInput);
    
    if (!isValidDomain(domain)) {
      return; // Don't show error for invalid domains during search
    }

    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const cachedData = tenantCache[domain];
      if (cachedData && isCacheValid(cachedData)) {
        setTenantInfo(cachedData);
        addToHistory(domain, cachedData);
        const links = generateAllPortalLinks(cachedData);
        setPortalLinks(links);
        setLoading(false);
        return;
      }

      const tenantData = await getTenantId(domain);
      setTenantInfo(tenantData);
      addToHistory(domain, tenantData);
      cacheTenantData(domain, tenantData);
      
      const links = generateAllPortalLinks(tenantData);
      setPortalLinks(links);
      
      toast.success(`Found tenant for ${domain}`);

    } catch (err) {
      setError(`Could not find tenant for ${domain}`);
      setTenantInfo(null);
      setPortalLinks(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input changes
  const handleSearchChange = (value) => {
    setSearchInput(value);
  };

  // Effect to handle domain lookup when search input changes (auto-search)
  useEffect(() => {
    if (manualSearchTriggered) {
      const resetTimeout = setTimeout(() => {
        setManualSearchTriggered(false);
      }, 2000);
      return () => clearTimeout(resetTimeout);
    }
    
    if (searchInput && (searchInput.includes('.') || searchInput.includes('@')) && !manualSearchTriggered) {
      const domain = extractDomain(searchInput);
      if (isValidDomain(domain)) {
        const timeoutId = setTimeout(() => {
          handleDomainLookup(searchInput);
        }, 1500);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [searchInput, manualSearchTriggered]);

  // Flatten portal links for display
  const allPortals = useMemo(() => {
    if (!portalLinks) return [];
    
    const flattened = [];
    
    Object.entries(portalLinks).forEach(([sectionKey, section]) => {
      Object.entries(section).forEach(([portalKey, portal]) => {
        flattened.push({
          key: `${sectionKey}-${portalKey}`,
          name: portal.name,
          description: portal.description,
          category: portal.category,
          tags: portal.tags,
          url: portal.url,
          requiresTenant: portal.requiresTenant || false,
          isFavorite: isClient && favorites.includes(`${sectionKey}-${portalKey}`)
        });
      });
    });
    
    // Sort by favorites first, then alphabetically
    return flattened.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      if (a.isFavorite && b.isFavorite) {
        return favorites.indexOf(a.key) - favorites.indexOf(b.key);
      }
      return a.name.localeCompare(b.name);
    });
  }, [portalLinks, favorites, isClient]);

  // Filter portals based on search, category, and tags
  const filteredPortals = useMemo(() => {
    let filtered = allPortals;

    // Filter by search term
    if (searchInput && !searchInput.includes('.') && !searchInput.includes('@')) {
      const searchTerm = searchInput.toLowerCase();
      filtered = filtered.filter(portal => 
        portal.name.toLowerCase().includes(searchTerm) ||
        portal.description.toLowerCase().includes(searchTerm) ||
        portal.category.toLowerCase().includes(searchTerm) ||
        (portal.tags && portal.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      );
    }

    // Filter by category or favorites
    if (selectedCategory === 'favorites') {
      filtered = filtered.filter(portal => portal.isFavorite);
    } else if (selectedCategory !== 'all') {
      filtered = filtered.filter(portal => 
        portal.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by selected tag
    if (selectedTag) {
      filtered = filtered.filter(portal => 
        portal.tags && portal.tags.some(tag => tag.toLowerCase() === selectedTag.toLowerCase())
      );
    }

    return filtered;
  }, [allPortals, searchInput, selectedCategory, selectedTag]);

  // Get category counts for filter pills
  const categoryCounts = useMemo(() => {
    const counts = {};
    allPortals.forEach(portal => {
      counts[portal.category] = (counts[portal.category] || 0) + 1;
    });
    return counts;
  }, [allPortals]);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set();
    allPortals.forEach(portal => {
      if (portal.tags) {
        portal.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [allPortals]);

  // Toggle favorite status
  const toggleFavorite = (portalKey, portalName) => {
    if (toggleInProgress.current) return;
    
    toggleInProgress.current = true;
    
    setFavorites(prev => {
      const isCurrentlyFavorite = prev.includes(portalKey);
      const newFavorites = isCurrentlyFavorite 
        ? prev.filter(key => key !== portalKey)
        : [...prev, portalKey];
      
      setTimeout(() => {
        toast.success(isCurrentlyFavorite 
          ? `${portalName} removed from favorites`
          : `${portalName} added to favorites`
        );
        toggleInProgress.current = false;
      }, 100);
      
      return newFavorites;
    });
  };

  // Handle search button click
  const handleSearchClick = (domainOverride) => {
    setManualSearchTriggered(true);
    handleDomainLookup(domainOverride);
  };

  // Clear history
  const clearHistory = () => {
    setLookupHistory([]);
    toast.success('History cleared');
  };

  // Handle remove domain from history
  const handleRemoveDomain = (domain) => {
    setDomainToRemove(domain);
    setRemoveModalOpen(true);
  };

  return (
    <>
      <SEOHead {...seoData} />
      <div className="space-y-6">
        <ToolHeader
          icon={MicrosoftPortalsIcon}
          title="Microsoft Portals (GDAP)"
          description="Quick access to Microsoft admin portals with GDAP tenant switching"
          iconColor="indigo"
          showTitle={false}
          standalone={true}
        />

        {/* Search Section */}
        <TenantSearchCard 
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          loading={loading}
          error={error}
          tenantInfo={tenantInfo}
          lookupHistory={lookupHistory}
          onSearch={handleSearchClick}
          onClearHistory={clearHistory}
          onRemoveDomain={handleRemoveDomain}
        />

        {/* Portal Links Section */}
        {portalLinks && (
          <Card className="relative rounded-xl shadow-sm ring-1 ring-border/60 before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r from-blue-500/60 to-cyan-400/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Microsoft Portals</CardTitle>
                  <CardDescription className="mt-1">
                    {filteredPortals.length} portals available
                    {tenantInfo && ` for ${tenantInfo.displayName || tenantInfo.domain}`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')} aria-label="Grid view">
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')} aria-label="List view">
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <PortalFilters 
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedTag={selectedTag}
                setSelectedTag={setSelectedTag}
                categoryCounts={categoryCounts}
                allTags={allTags}
                allPortals={allPortals}
                favorites={favorites}
              />

              {/* Portal Grid/List */}
              {filteredPortals.length === 0 ? (
                <EmptyState allPortals={allPortals} />
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPortals.map((portal) => (
                    <PortalCard 
                      key={portal.key}
                      portal={portal}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              ) : (
                <PortalTable 
                  portals={filteredPortals}
                  onToggleFavorite={toggleFavorite}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Remove Domain Confirmation Dialog */}
        <Dialog open={removeModalOpen} onOpenChange={setRemoveModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove from Recent</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove "{domainToRemove}" from your recent searches?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRemoveModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => removeDomainFromHistory(domainToRemove)}
              >
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default MicrosoftPortalsShadcn;