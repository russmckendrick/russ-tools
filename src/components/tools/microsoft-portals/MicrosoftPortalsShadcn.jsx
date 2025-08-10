import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Search,
  Copy,
  ExternalLink,
  AlertCircle,
  Filter,
  X,
  Star,
  Trash2,
  Building,
  RefreshCw,
  Bookmark,
  History,
  Grid3X3,
  List
} from 'lucide-react';
import { getTenantId, isValidDomain, extractDomain } from './TenantLookup';
import { generateAllPortalLinks } from './PortalLinkGenerator';
import SEOHead from '../../common/SEOHead';
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

  // Copy portal URL to clipboard
  const copyPortalUrl = async (url, name) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(`${name} URL copied to clipboard`);
    } catch (err) {
      toast.error('Failed to copy URL');
    }
  };

  return (
    <>
      <SEOHead {...seoData} />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Building className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Microsoft Portals (GDAP)</h1>
              <p className="text-muted-foreground">
                Quick access to Microsoft admin portals with GDAP tenant switching
              </p>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tenant Lookup & Portal Access</CardTitle>
            <CardDescription>
              Enter a domain name or email address to find the tenant and generate portal links
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Enter domain (e.g., contoso.com) or email address..."
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <Button
                  onClick={() => {
                    setManualSearchTriggered(true);
                    handleDomainLookup();
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Search
                </Button>
              </div>

              {/* Recent Searches */}
              {lookupHistory.length > 0 && (
                <div className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Recent Searches</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLookupHistory([])}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {lookupHistory.slice(0, 5).map((item, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          setSearchInput(item.domain);
                          handleDomainLookup(item.domain);
                        }}
                      >
                        <History className="h-3 w-3 mr-1" />
                        {item.domain}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-2 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDomainToRemove(item.domain);
                            setRemoveModalOpen(true);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Tenant Info */}
              {tenantInfo && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Tenant Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Domain</Label>
                        <p className="text-sm text-muted-foreground">{tenantInfo.domain}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Tenant ID</Label>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted p-1 rounded">
                            {tenantInfo.tenantId}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyPortalUrl(tenantInfo.tenantId, 'Tenant ID')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {tenantInfo.displayName && (
                        <div>
                          <Label className="text-sm font-medium">Display Name</Label>
                          <p className="text-sm text-muted-foreground">{tenantInfo.displayName}</p>
                        </div>
                      )}
                      {tenantInfo.method && (
                        <div>
                          <Label className="text-sm font-medium">Lookup Method</Label>
                          <Badge variant="secondary" className="text-xs">
                            {tenantInfo.method}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Portal Links Section */}
        {portalLinks && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Microsoft Portals</CardTitle>
                  <CardDescription>
                    {filteredPortals.length} portals available
                    {tenantInfo && ` for ${tenantInfo.displayName || tenantInfo.domain}`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="category-filter">Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger id="category-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories ({allPortals.length})</SelectItem>
                        <SelectItem value="favorites">Favorites ({favorites.length})</SelectItem>
                        <Separator />
                        {Object.entries(categoryCounts).map(([category, count]) => (
                          <SelectItem key={category} value={category.toLowerCase()}>
                            {category} ({count})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {allTags.length > 0 && (
                    <div className="flex-1">
                      <Label htmlFor="tag-filter">Filter by Tag</Label>
                      <Select value={selectedTag || ''} onValueChange={(value) => setSelectedTag(value || null)}>
                        <SelectTrigger id="tag-filter">
                          <SelectValue placeholder="All Tags" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Tags</SelectItem>
                          {allTags.map(tag => (
                            <SelectItem key={tag} value={tag.toLowerCase()}>
                              {tag}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {(selectedCategory !== 'all' || selectedTag) && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Active filters:</span>
                    {selectedCategory !== 'all' && (
                      <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedCategory('all')}>
                        {selectedCategory} <X className="h-3 w-3 ml-1" />
                      </Badge>
                    )}
                    {selectedTag && (
                      <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedTag(null)}>
                        {selectedTag} <X className="h-3 w-3 ml-1" />
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Portal Grid/List */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPortals.map((portal) => (
                    <Card key={portal.key} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">{portal.name}</CardTitle>
                            <CardDescription className="text-sm line-clamp-2">
                              {portal.description}
                            </CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-shrink-0 ml-2"
                            onClick={() => toggleFavorite(portal.key, portal.name)}
                          >
                            {portal.isFavorite ? (
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ) : (
                              <Star className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-xs">
                              {portal.category}
                            </Badge>
                            {portal.tags && portal.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => window.open(portal.url, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-2" />
                              Open
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyPortalUrl(portal.url, portal.name)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPortals.map((portal) => (
                      <TableRow key={portal.key}>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFavorite(portal.key, portal.name)}
                          >
                            {portal.isFavorite ? (
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ) : (
                              <Star className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">{portal.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-md">
                          {portal.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{portal.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => window.open(portal.url, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Open
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyPortalUrl(portal.url, portal.name)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {filteredPortals.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No portals found</h3>
                  <p className="text-muted-foreground">
                    {allPortals.length === 0 
                      ? 'Search for a tenant to see available portals'
                      : 'Try adjusting your filters or search terms'
                    }
                  </p>
                </div>
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