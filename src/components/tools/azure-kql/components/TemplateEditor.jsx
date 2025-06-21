import React, { useState, useEffect } from 'react';
import {
  Stack,
  Paper,
  Title,
  Text,
  TextInput,
  Textarea,
  Button,
  Group,
  Select,
  Alert,
  Badge,
  Accordion,
  ActionIcon,
  Modal,
  JsonInput,
  Tabs,
  Code,
  ScrollArea,
  Notification
} from '@mantine/core';
import {
  IconPlus,
  IconTrash,
  IconCode,
  IconTemplate,
  IconFileExport,
  IconFileImport,
  IconAlertTriangle,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

const TemplateEditor = ({ onTemplateCreate, onTemplateUpdate }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [previewQuery, setPreviewQuery] = useState('');
  
  const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);
  const [importModalOpened, { open: openImportModal, close: closeImportModal }] = useDisclosure(false);

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    service: {
      id: '',
      name: '',
      description: '',
      category: '',
      version: '1.0.0'
    },
    schema: {
      tables: {
        primary: '',
        secondary: [],
        legacy: ''
      },
      fields: {}
    },
    templates: {}
  });

  // Load existing templates from localStorage
  useEffect(() => {
    const customTemplates = JSON.parse(localStorage.getItem('azure-kql-custom-templates') || '[]');
    setTemplates(customTemplates);
  }, []);

  // Save templates to localStorage
  const saveTemplates = (newTemplates) => {
    localStorage.setItem('azure-kql-custom-templates', JSON.stringify(newTemplates));
    setTemplates(newTemplates);
  };

  // Validate template structure
  const validateTemplate = (template) => {
    const errors = [];
    
    // Service validation
    if (!template.service?.id) errors.push('Service ID is required');
    if (!template.service?.name) errors.push('Service name is required');
    if (!template.service?.description) errors.push('Service description is required');
    
    // Schema validation
    if (!template.schema?.tables?.primary) errors.push('Primary table is required');
    if (!template.schema?.fields || Object.keys(template.schema.fields).length === 0) {
      errors.push('At least one field is required');
    }
    
    // Field validation
    Object.entries(template.schema?.fields || {}).forEach(([fieldName, fieldConfig]) => {
      if (!fieldConfig.type) errors.push(`Field "${fieldName}" is missing type`);
      if (!fieldConfig.description) errors.push(`Field "${fieldName}" is missing description`);
    });
    
    return errors;
  };

  // Create new template
  const handleCreateTemplate = () => {
    const errors = validateTemplate(templateForm);
    setValidationErrors(errors);
    
    if (errors.length === 0) {
      const newTemplate = {
        ...templateForm,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        isCustom: true
      };
      
      const updatedTemplates = [...templates, newTemplate];
      saveTemplates(updatedTemplates);
      
      if (onTemplateCreate) {
        onTemplateCreate(newTemplate);
      }
      
      notifications.show({
        title: 'Template Created',
        message: `Template "${templateForm.service.name}" has been created successfully`,
        color: 'green',
        icon: <IconCheck size={16} />
      });
      
      closeCreateModal();
      resetForm();
    }
  };

  // Update existing template
  const handleUpdateTemplate = () => {
    if (!selectedTemplate) return;
    
    const errors = validateTemplate(templateForm);
    setValidationErrors(errors);
    
    if (errors.length === 0) {
      const updatedTemplate = {
        ...templateForm,
        id: selectedTemplate.id,
        createdAt: selectedTemplate.createdAt,
        updatedAt: new Date().toISOString(),
        isCustom: true
      };
      
      const updatedTemplates = templates.map(t => 
        t.id === selectedTemplate.id ? updatedTemplate : t
      );
      saveTemplates(updatedTemplates);
      
      if (onTemplateUpdate) {
        onTemplateUpdate(updatedTemplate);
      }
      
      notifications.show({
        title: 'Template Updated',
        message: `Template "${templateForm.service.name}" has been updated successfully`,
        color: 'blue',
        icon: <IconCheck size={16} />
      });
      
      setIsEditing(false);
      setSelectedTemplate(null);
    }
  };

  // Delete template
  const handleDeleteTemplate = (templateId) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    saveTemplates(updatedTemplates);
    
    notifications.show({
      title: 'Template Deleted',
      message: 'Template has been deleted successfully',
      color: 'red',
      icon: <IconTrash size={16} />
    });
    
    if (selectedTemplate?.id === templateId) {
      setSelectedTemplate(null);
      setIsEditing(false);
    }
  };

  // Export template
  const handleExportTemplate = (template) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${template.service.id}-template.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Import template
  const handleImportTemplate = (jsonString) => {
    try {
      const imported = JSON.parse(jsonString);
      const errors = validateTemplate(imported);
      
      if (errors.length === 0) {
        // Check if template with same ID exists
        const existingIndex = templates.findIndex(t => t.service.id === imported.service.id);
        
        const newTemplate = {
          ...imported,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          isCustom: true,
          imported: true
        };
        
        let updatedTemplates;
        if (existingIndex >= 0) {
          updatedTemplates = templates.map((t, i) => i === existingIndex ? newTemplate : t);
        } else {
          updatedTemplates = [...templates, newTemplate];
        }
        
        saveTemplates(updatedTemplates);
        
        notifications.show({
          title: 'Template Imported',
          message: `Template "${imported.service.name}" has been imported successfully`,
          color: 'green',
          icon: <IconCheck size={16} />
        });
        
        closeImportModal();
      } else {
        notifications.show({
          title: 'Import Failed',
          message: `Template validation failed: ${errors.join(', ')}`,
          color: 'red',
          icon: <IconX size={16} />
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Import Failed',
        message: 'Invalid JSON format',
        color: 'red',
        icon: <IconX size={16} />
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setTemplateForm({
      service: {
        id: '',
        name: '',
        description: '',
        category: '',
        version: '1.0.0'
      },
      schema: {
        tables: {
          primary: '',
          secondary: [],
          legacy: ''
        },
        fields: {}
      },
      templates: {}
    });
    setValidationErrors([]);
  };

  // Load template for editing
  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setTemplateForm(template);
    setIsEditing(true);
  };

  const addField = () => {
    const fieldName = `field_${Object.keys(templateForm.schema.fields).length + 1}`;
    setTemplateForm(prev => ({
      ...prev,
      schema: {
        ...prev.schema,
        fields: {
          ...prev.schema.fields,
          [fieldName]: {
            type: 'string',
            required: false,
            description: '',
            kqlField: fieldName
          }
        }
      }
    }));
  };

  const removeField = (fieldName) => {
    setTemplateForm(prev => {
      const newFields = { ...prev.schema.fields };
      delete newFields[fieldName];
      return {
        ...prev,
        schema: {
          ...prev.schema,
          fields: newFields
        }
      };
    });
  };

  const updateField = (fieldName, property, value) => {
    setTemplateForm(prev => ({
      ...prev,
      schema: {
        ...prev.schema,
        fields: {
          ...prev.schema.fields,
          [fieldName]: {
            ...prev.schema.fields[fieldName],
            [property]: value
          }
        }
      }
    }));
  };

  return (
    <Stack gap="lg">
      <Paper p="md" withBorder>
        <Group justify="space-between" mb="md">
          <div>
            <Title order={3}>Template Editor</Title>
            <Text size="sm" c="dimmed">
              Create and manage custom Azure service templates
            </Text>
          </div>
          <Group>
            <Button 
              leftSection={<IconPlus size={16} />} 
              onClick={openCreateModal}
              variant="filled"
            >
              New Template
            </Button>
            <Button 
              leftSection={<IconFileImport size={16} />} 
              onClick={openImportModal}
              variant="light"
            >
              Import
            </Button>
          </Group>
        </Group>

        {/* Template List */}
        {templates.length === 0 ? (
          <Alert color="gray" title="No Custom Templates">
            You haven't created any custom templates yet. Click "New Template" to get started.
          </Alert>
        ) : (
          <Stack gap="sm">
            {templates.map(template => (
              <Paper key={template.id} p="md" withBorder>
                <Group justify="space-between">
                  <div>
                    <Group gap="sm">
                      <Text fw={600}>{template.service.name}</Text>
                      <Badge size="sm" color="blue">{template.service.category}</Badge>
                      {template.imported && <Badge size="sm" color="green">Imported</Badge>}
                    </Group>
                    <Text size="sm" c="dimmed" mt="xs">
                      {template.service.description}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Fields: {Object.keys(template.schema.fields).length} | 
                      Created: {new Date(template.createdAt).toLocaleDateString()}
                    </Text>
                  </div>
                  <Group gap="xs">
                    <ActionIcon 
                      variant="light" 
                      color="blue"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <IconCode size={16} />
                    </ActionIcon>
                    <ActionIcon 
                      variant="light" 
                      color="green"
                      onClick={() => handleExportTemplate(template)}
                    >
                      <IconFileExport size={16} />
                    </ActionIcon>
                    <ActionIcon 
                      variant="light" 
                      color="red"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

      {/* Create Template Modal */}
      <Modal
        opened={createModalOpened || isEditing}
        onClose={() => {
          closeCreateModal();
          setIsEditing(false);
          resetForm();
        }}
        title={isEditing ? "Edit Template" : "Create New Template"}
        size="xl"
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <Stack gap="md">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert 
              icon={<IconAlertTriangle size={16} />} 
              color="red"
              title="Template Validation Errors"
            >
              <Stack gap="xs">
                {validationErrors.map((error, index) => (
                  <Text key={index} size="sm">• {error}</Text>
                ))}
              </Stack>
            </Alert>
          )}

          <Tabs defaultValue="service">
            <Tabs.List>
              <Tabs.Tab value="service" leftSection={<IconTemplate size={16} />}>Service</Tabs.Tab>
              <Tabs.Tab value="fields" leftSection={<IconCode size={16} />}>Fields</Tabs.Tab>
              <Tabs.Tab value="preview" leftSection={<IconFileExport size={16} />}>Preview</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="service" pt="md">
              <Stack gap="md">
                <TextInput
                  label="Service ID"
                  placeholder="azure-application-gateway"
                  value={templateForm.service.id}
                  onChange={(e) => setTemplateForm(prev => ({
                    ...prev,
                    service: { ...prev.service, id: e.target.value }
                  }))}
                  required
                />
                <TextInput
                  label="Service Name"
                  placeholder="Azure Application Gateway"
                  value={templateForm.service.name}
                  onChange={(e) => setTemplateForm(prev => ({
                    ...prev,
                    service: { ...prev.service, name: e.target.value }
                  }))}
                  required
                />
                <Textarea
                  label="Description"
                  placeholder="Azure Application Gateway web traffic load balancer"
                  value={templateForm.service.description}
                  onChange={(e) => setTemplateForm(prev => ({
                    ...prev,
                    service: { ...prev.service, description: e.target.value }
                  }))}
                  required
                />
                <Select
                  label="Category"
                  placeholder="Select category"
                  data={[
                    'Network Security',
                    'Load Balancing',
                    'Application Services',
                    'Monitoring',
                    'Storage',
                    'Compute'
                  ]}
                  value={templateForm.service.category}
                  onChange={(value) => setTemplateForm(prev => ({
                    ...prev,
                    service: { ...prev.service, category: value }
                  }))}
                  required
                />
                <TextInput
                  label="Primary Table"
                  placeholder="AzureDiagnostics"
                  value={templateForm.schema.tables.primary}
                  onChange={(e) => setTemplateForm(prev => ({
                    ...prev,
                    schema: {
                      ...prev.schema,
                      tables: {
                        ...prev.schema.tables,
                        primary: e.target.value
                      }
                    }
                  }))}
                  required
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="fields" pt="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <Text fw={600}>Template Fields</Text>
                  <Button size="xs" onClick={addField}>
                    <IconPlus size={14} />
                  </Button>
                </Group>

                {Object.entries(templateForm.schema.fields).map(([fieldName, fieldConfig]) => (
                  <Paper key={fieldName} p="md" withBorder>
                    <Group justify="space-between" mb="md">
                      <Text fw={500}>{fieldName}</Text>
                      <ActionIcon 
                        color="red" 
                        variant="light"
                        onClick={() => removeField(fieldName)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                    <Stack gap="sm">
                      <Select
                        label="Type"
                        data={['string', 'number', 'ipaddress', 'datetime', 'select', 'multiselect']}
                        value={fieldConfig.type}
                        onChange={(value) => updateField(fieldName, 'type', value)}
                      />
                      <TextInput
                        label="Description"
                        value={fieldConfig.description}
                        onChange={(e) => updateField(fieldName, 'description', e.target.value)}
                      />
                      <TextInput
                        label="KQL Field"
                        value={fieldConfig.kqlField}
                        onChange={(e) => updateField(fieldName, 'kqlField', e.target.value)}
                      />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="preview" pt="md">
              <JsonInput
                label="Template JSON Preview"
                value={JSON.stringify(templateForm, null, 2)}
                readOnly
                minRows={15}
                maxRows={25}
                autosize
              />
            </Tabs.Panel>
          </Tabs>

          <Group justify="flex-end" mt="xl">
            <Button 
              variant="light" 
              onClick={() => {
                closeCreateModal();
                setIsEditing(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={isEditing ? handleUpdateTemplate : handleCreateTemplate}
            >
              {isEditing ? 'Update Template' : 'Create Template'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Import Template Modal */}
      <Modal
        opened={importModalOpened}
        onClose={closeImportModal}
        title="Import Template"
        size="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Paste a template JSON to import it into your custom templates.
          </Text>
          <JsonInput
            label="Template JSON"
            placeholder="Paste template JSON here..."
            minRows={10}
            maxRows={20}
            autosize
            id="import-json"
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={closeImportModal}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                const jsonValue = document.getElementById('import-json').value;
                handleImportTemplate(jsonValue);
              }}
            >
              Import Template
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default TemplateEditor;