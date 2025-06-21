import React, { useState } from 'react';
import { 
  Stack, 
  Text, 
  Paper, 
  Button, 
  Group, 
  Badge,
  Code,
  ActionIcon,
  Tooltip,
  ScrollArea,
  Alert,
  TextInput,
  Modal,
  Textarea
} from '@mantine/core';
import { 
  IconStar, 
  IconStarFilled, 
  IconTrash, 
  IconExternalLink, 
  IconReload, 
  IconEdit,
  IconPlus,
  IconSearch
} from '@tabler/icons-react';
import { useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

const QueryFavorites = ({ onLoadQuery, currentQuery, currentService, currentTemplate, currentParameters }) => {
  const [favorites, setFavorites] = useLocalStorage({
    key: 'azure-kql-favorites',
    defaultValue: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingFavorite, setEditingFavorite] = useState(null);
  const [favoriteName, setFavoriteName] = useState('');
  const [favoriteDescription, setFavoriteDescription] = useState('');

  // Check if current query is favorited
  const isCurrentQueryFavorited = () => {
    if (!currentQuery) return false;
    return favorites.some(fav => fav.query === currentQuery);
  };

  // Add current query to favorites
  const addToFavorites = () => {
    if (!currentQuery) {
      notifications.show({
        title: 'No Query',
        message: 'Generate a query first before adding to favorites',
        color: 'orange'
      });
      return;
    }

    const favoriteEntry = {
      id: Date.now().toString(),
      name: `${currentService} - ${currentTemplate}`,
      description: `Query for ${currentService} using ${currentTemplate} template`,
      timestamp: new Date().toISOString(),
      service: currentService,
      template: currentTemplate,
      parameters: { ...currentParameters },
      query: currentQuery,
      tags: [currentService, currentTemplate]
    };

    setFavorites(prev => [favoriteEntry, ...prev]);
    
    notifications.show({
      title: 'Added to Favorites',
      message: 'Query has been saved to your favorites',
      color: 'green'
    });
  };

  // Remove from favorites
  const removeFromFavorites = (favoriteId) => {
    setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
    
    notifications.show({
      title: 'Removed from Favorites',
      message: 'Query has been removed from favorites',
      color: 'red'
    });
  };

  // Load favorite query
  const loadFavorite = (favorite) => {
    onLoadQuery({
      service: favorite.service,
      template: favorite.template,
      parameters: favorite.parameters,
      query: favorite.query,
      name: favorite.name
    });

    notifications.show({
      title: 'Favorite Loaded',
      message: `Loaded "${favorite.name}" from favorites`,
      color: 'blue'
    });
  };

  // Open edit modal
  const openEditModal = (favorite) => {
    setEditingFavorite(favorite);
    setFavoriteName(favorite.name);
    setFavoriteDescription(favorite.description);
    setEditModalOpen(true);
  };

  // Save edited favorite
  const saveEditedFavorite = () => {
    if (!favoriteName.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Favorite name is required',
        color: 'red'
      });
      return;
    }

    setFavorites(prev => prev.map(fav => 
      fav.id === editingFavorite.id 
        ? { ...fav, name: favoriteName, description: favoriteDescription }
        : fav
    ));

    setEditModalOpen(false);
    setEditingFavorite(null);
    setFavoriteName('');
    setFavoriteDescription('');

    notifications.show({
      title: 'Favorite Updated',
      message: 'Favorite has been updated successfully',
      color: 'green'
    });
  };

  // Filter favorites based on search
  const filteredFavorites = favorites.filter(favorite => 
    favorite.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    favorite.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    favorite.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
    favorite.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Stack gap="md">
      {/* Header with Add to Favorites */}
      <Group justify="space-between">
        <Group gap="sm">
          <Text size="lg" fw={600}>
            Query Favorites
          </Text>
          <Badge size="sm" color="yellow">
            {favorites.length} saved
          </Badge>
        </Group>
        
        <Button
          variant={isCurrentQueryFavorited() ? 'light' : 'filled'}
          color="yellow"
          size="sm"
          leftSection={isCurrentQueryFavorited() ? <IconStarFilled size={16} /> : <IconStar size={16} />}
          onClick={addToFavorites}
          disabled={!currentQuery || isCurrentQueryFavorited()}
        >
          {isCurrentQueryFavorited() ? 'Favorited' : 'Add to Favorites'}
        </Button>
      </Group>

      {/* Search */}
      {favorites.length > 0 && (
        <TextInput
          placeholder="Search favorites..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      )}

      {/* Favorites List */}
      {filteredFavorites.length === 0 ? (
        <Paper p="xl" withBorder>
          <Stack gap="md" align="center">
            <IconStar size={48} color="gray" />
            <Text c="dimmed" ta="center">
              {favorites.length === 0 
                ? 'No favorite queries yet'
                : 'No favorites match your search'
              }
            </Text>
            {favorites.length === 0 && (
              <Text size="sm" c="dimmed" ta="center">
                Generate and save queries to see them here
              </Text>
            )}
          </Stack>
        </Paper>
      ) : (
        <Stack gap="md">
          {filteredFavorites.map((favorite) => (
            <Paper key={favorite.id} p="md" withBorder>
              <Stack gap="sm">
                {/* Header */}
                <Group justify="space-between">
                  <div>
                    <Text fw={500} size="sm">
                      {favorite.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {formatDate(favorite.timestamp)}
                    </Text>
                  </div>
                  
                  <Group gap="xs">
                    {favorite.tags.map(tag => (
                      <Badge key={tag} size="xs" color="blue">
                        {tag}
                      </Badge>
                    ))}
                  </Group>
                </Group>

                {/* Description */}
                {favorite.description && (
                  <Text size="sm" c="dimmed">
                    {favorite.description}
                  </Text>
                )}

                {/* Query Preview */}
                <ScrollArea.Autosize mah={120}>
                  <Code block size="xs" style={{ fontSize: '11px' }}>
                    {favorite.query}
                  </Code>
                </ScrollArea.Autosize>

                {/* Parameters */}
                {favorite.parameters && Object.keys(favorite.parameters).length > 0 && (
                  <Group gap="xs">
                    <Text size="xs" c="dimmed">Parameters:</Text>
                    {Object.entries(favorite.parameters)
                      .filter(([, value]) => value !== undefined && value !== null && value !== '')
                      .slice(0, 3)
                      .map(([key, value]) => (
                        <Badge key={key} size="xs" variant="light">
                          {key}: {String(value)}
                        </Badge>
                      ))}
                    {Object.entries(favorite.parameters).filter(([, value]) => value !== undefined && value !== null && value !== '').length > 3 && (
                      <Badge size="xs" variant="light" color="gray">
                        +{Object.entries(favorite.parameters).filter(([, value]) => value !== undefined && value !== null && value !== '').length - 3} more
                      </Badge>
                    )}
                  </Group>
                )}

                {/* Actions */}
                <Group justify="space-between">
                  <Button
                    variant="light"
                    size="xs"
                    leftSection={<IconReload size={14} />}
                    onClick={() => loadFavorite(favorite)}
                  >
                    Load Query
                  </Button>
                  
                  <Group gap="xs">
                    <Tooltip label="Edit Favorite">
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        onClick={() => openEditModal(favorite)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Open in Azure Portal">
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        onClick={() => {
                          const encodedQuery = encodeURIComponent(favorite.query);
                          const azureUrl = `https://portal.azure.com/#blade/Microsoft_Azure_Monitoring_Logs/LogsBlade/resourceId/%2F/source/LogsBlade.AnalyticsShareLinkToQuery/query/${encodedQuery}`;
                          window.open(azureUrl, '_blank');
                        }}
                      >
                        <IconExternalLink size={16} />
                      </ActionIcon>
                    </Tooltip>
                    
                    <Tooltip label="Remove from Favorites">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        onClick={() => removeFromFavorites(favorite.id)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Group>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {/* Edit Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Favorite"
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="Name"
            placeholder="Enter favorite name"
            value={favoriteName}
            onChange={(e) => setFavoriteName(e.target.value)}
            required
          />
          
          <Textarea
            label="Description"
            placeholder="Enter description (optional)"
            value={favoriteDescription}
            onChange={(e) => setFavoriteDescription(e.target.value)}
            rows={3}
          />

          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEditedFavorite}>
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Info */}
      <Alert variant="light" color="blue">
        <Text size="sm">
          Favorite queries are stored locally in your browser. 
          Use favorites to quickly access frequently used query configurations.
        </Text>
      </Alert>
    </Stack>
  );
};

export default QueryFavorites;