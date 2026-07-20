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
  Grid3X3,
  List
} from 'lucide-react';
import { createToolStorage } from '@/core';
import { useLookupTool } from '@/lib/useLookupTool';
import { getTenantId, isValidDomain, extractDomain } from './lib/tenantLookup';
import { generateAllPortalLinks } from './lib/portalLinks';
import TenantSearchCard from './components/TenantSearchCard';
import PortalFilters from './components/PortalFilters';
import PortalCard from './components/PortalCard';
import PortalTable from './components/PortalTable';
import EmptyState from './components/EmptyState';

const MicrosoftPortalsTool = () => {
  // searchInput doubles as the portal *filter* box, so it stays tool state
  // rather than the hook's query — and the deep link therefore has to fill
  // both, which is why the param effect lives here instead of in the hook.
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [domainToRemove, setDomainToRemove] = useState(null);
  const [manualSearchTriggered, setManualSearchTriggered] = useState(false);

  const {
    result: tenantInfo,
    loading,
    error,
    lookup,
    history: lookupHistory,
    clearHistory: clearStoredHistory,
    removeFromHistory,
  } = useLookupTool({
    toolId: 'microsoft-portals',
    fetcher: (domain) => getTenantId(domain),
    cacheTTL: 10 * 60 * 1000,
    maxHistory: 10,
    normalize: extractDomain,
    legacy: { history: 'microsoft-portals-history' },
    historyEntry: (q, data) => ({ domain: q, tenantId: data.tenantId }),
    onSuccess: (q, data, fromCache) => {
      if (!fromCache) toast.success(`Found tenant for ${q}`);
    },
    onError: (q) => {
      // The alert below carries the message; the old tool showed no toast.
      void q;
    },
  });

  // Favorites, in their own slot — read forward from the pre-port key.
  const storage = useMemo(() => createToolStorage('microsoft-portals'), []);
  const [favorites, setFavorites] = useState(() =>
    storage.get('favorites', { fallback: [], legacy: 'microsoft-portals-favorites' })
  );
  useEffect(() => {
    storage.set('favorites', favorites);
  }, [storage, favorites]);

  const toggleInProgress = useRef(false);

  const portalLinks = useMemo(
    () => (tenantInfo ? generateAllPortalLinks(tenantInfo) : null),
    [tenantInfo]
  );

  const displayError = error ? `Could not find tenant for ${extractDomain(searchInput) || 'that domain'}` : null;

  // Perform tenant lookup (silently ignores not-yet-valid input, since this
  // also fires from the debounced auto-search below).
  const handleDomainLookup = (domainToLookup) => {
    const domain = extractDomain(domainToLookup || searchInput);
    if (!isValidDomain(domain)) return;
    lookup(domain);
  };

  // Deep link: fill the search box and look the domain up.
  const { domain: urlDomain } = useParams();
  useEffect(() => {
    if (urlDomain && urlDomain.trim()) {
      const decodedDomain = decodeURIComponent(urlDomain);
      setSearchInput(decodedDomain);
      handleDomainLookup(decodedDomain);
    }
  }, [urlDomain]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-search while typing something domain-shaped.
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
  }, [searchInput, manualSearchTriggered]); // eslint-disable-line react-hooks/exhaustive-deps

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
          isFavorite: favorites.includes(`${sectionKey}-${portalKey}`)
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
  }, [portalLinks, favorites]);

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
    clearStoredHistory();
    toast.success('History cleared');
  };

  // Handle remove domain from history
  const handleRemoveDomain = (domain) => {
    setDomainToRemove(domain);
    setRemoveModalOpen(true);
  };

  const removeDomainFromHistory = (domain) => {
    // Predicate form: legacy entries have `domain` but no `query`.
    removeFromHistory((item) => (item.query ?? item.domain) === domain);
    setRemoveModalOpen(false);
    setDomainToRemove(null);
    toast.success(`${domain} removed from recent domains`);
  };

  return (
    <div className="space-y-6">
        {/* Search Section */}
        <TenantSearchCard
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          loading={loading}
          error={displayError}
          tenantInfo={tenantInfo}
          lookupHistory={lookupHistory}
          onSearch={handleSearchClick}
          onClearHistory={clearHistory}
          onRemoveDomain={handleRemoveDomain}
        />

        {/* Portal Links Section */}
        {portalLinks && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-title-sm">Microsoft Portals</CardTitle>
                  <CardDescription className="mt-1">
                    {filteredPortals.length} portals available
                    {tenantInfo && ` for ${tenantInfo.displayName || tenantInfo.domain}`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button className="interactive" variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')} aria-label="Grid view">
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button className="interactive" variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')} aria-label="List view">
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
  );
};

export default MicrosoftPortalsTool;
