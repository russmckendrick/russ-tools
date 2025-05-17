import React, { useState } from 'react';
import { Paper, Group, Text, Button, Divider, Stack, ScrollArea, Modal } from '@mantine/core';
import { useAzureNamingContext } from '../../../context/AzureNamingContext';

const NamingHistory = () => {
  const { namingHistory, clearHistory, setFormState, setPendingLoad, resourceTypes, setNamingHistory } = useAzureNamingContext();
  const [deleteId, setDeleteId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLoadConfiguration = (configuration) => {
    setFormState(configuration);
    setPendingLoad(true);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      setNamingHistory(prev => prev.filter(item => item.id !== deleteId));
    }
    setShowConfirm(false);
    setDeleteId(null);
  };

  const getResourceTypeLabel = (value) => {
    const found = resourceTypes.find(rt => rt.value === value);
    return found ? found.label.replace(/ \([^)]+\)$/, '') : value;
  };

  if (namingHistory.length === 0) {
    return null;
  }

  return (
    <>
      <Stack gap={0}>
        {namingHistory.map((item) => (
          <Group key={item.id} justify="space-between" align="center" mb="xs" p="sm" style={{ border: '1px solid #eee', borderRadius: 8 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <Text size="sm" fw={500} truncate c="blue.7">
                {item.configuration?.workload || 'Unnamed Workload'}
              </Text>
              <Text size="xs" c="dimmed" mt={2}>
                {item.group && Array.isArray(item.group)
                  ? item.group.map((g, idx) => getResourceTypeLabel(g.resourceType)).join(', ')
                  : ''}
              </Text>
              <Text size="xs" c="dimmed" mt={2}>
                {new Date(item.timestamp).toLocaleString()}
              </Text>
            </div>
            <Group gap={4}>
              <Button
                onClick={() => handleLoadConfiguration(item.configuration)}
                size="xs"
                color="blue"
                variant="light"
              >
                Load
              </Button>
              <Button
                onClick={() => handleDelete(item.id)}
                size="xs"
                color="red"
                variant="outline"
              >
                Delete
              </Button>
            </Group>
          </Group>
        ))}
      </Stack>
      <Modal opened={showConfirm} onClose={() => setShowConfirm(false)} title="Delete Name?" centered>
        <Text>Are you sure you want to delete this name? This action cannot be undone.</Text>
        <Group mt="md" position="right">
          <Button variant="default" onClick={() => setShowConfirm(false)}>
            Cancel
          </Button>
          <Button color="red" onClick={confirmDelete}>
            Delete
          </Button>
        </Group>
      </Modal>
    </>
  );
};

export default NamingHistory; 