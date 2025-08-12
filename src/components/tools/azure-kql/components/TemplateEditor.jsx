import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Label } from '../../../ui/label';
import { Textarea } from '../../../ui/textarea';
import { Alert, AlertDescription } from '../../../ui/alert';
import { Badge } from '../../../ui/badge';
import { 
  Plus, 
  Save, 
  Trash2, 
  FileCode,
  AlertCircle,
  Info
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { getCustomTemplates, saveCustomTemplate, deleteCustomTemplate } from '../utils/templateLoader';
import { toast } from 'sonner';

const TemplateEditor = ({ onTemplateCreate, onTemplateUpdate }) => {
  const [templates, setTemplates] = useState(getCustomTemplates());
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editMode, setEditMode] = useState('new');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    service: 'azure-firewall',
    table: 'AZFWNetworkRule',
    fields: [],
    aggregation: '',
    projection: '',
    defaultLimit: 100
  });

  const handleSave = () => {
    if (!formData.name) {
      toast.error('Template name is required');
      return;
    }

    const template = {
      ...formData,
      id: selectedTemplate?.id || `custom-${Date.now()}`,
      projection: formData.projection ? formData.projection.split(',').map(s => s.trim()) : [],
      timestamp: new Date().toISOString()
    };

    saveCustomTemplate(template);
    setTemplates(getCustomTemplates());
    
    if (editMode === 'new') {
      onTemplateCreate?.(template);
      toast.success('Template created successfully');
    } else {
      onTemplateUpdate?.(template);
      toast.success('Template updated successfully');
    }

    resetForm();
  };

  const handleDelete = () => {
    if (!selectedTemplate) return;
    
    deleteCustomTemplate(selectedTemplate.id);
    setTemplates(getCustomTemplates());
    toast.success('Template deleted');
    resetForm();
  };

  const handleLoad = (template) => {
    setSelectedTemplate(template);
    setEditMode('edit');
    setFormData({
      ...template,
      projection: template.projection?.join(', ') || ''
    });
  };

  const resetForm = () => {
    setSelectedTemplate(null);
    setEditMode('new');
    setFormData({
      name: '',
      description: '',
      service: 'azure-firewall',
      table: 'AZFWNetworkRule',
      fields: [],
      aggregation: '',
      projection: '',
      defaultLimit: 100
    });
  };

  const addField = () => {
    setFormData({
      ...formData,
      fields: [
        ...formData.fields,
        {
          name: '',
          label: '',
          type: 'text',
          kqlField: '',
          essential: false,
          required: false,
          placeholder: '',
          description: ''
        }
      ]
    });
  };

  const updateField = (index, key, value) => {
    const newFields = [...formData.fields];
    newFields[index] = { ...newFields[index], [key]: value };
    setFormData({ ...formData, fields: newFields });
  };

  const removeField = (index) => {
    const newFields = formData.fields.filter((_, i) => i !== index);
    setFormData({ ...formData, fields: newFields });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="w-5 h-5" />
            Template Editor
          </CardTitle>
          <CardDescription>
            Create and manage custom KQL query templates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {templates.length > 0 && (
            <div className="space-y-2">
              <Label>Load Template</Label>
              <div className="flex gap-2">
                <Select 
                  value={selectedTemplate?.id || ''} 
                  onValueChange={(id) => {
                    const template = templates.find(t => t.id === id);
                    if (template) handleLoad(template);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template to edit" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  New
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Custom Template"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="service">Service</Label>
                <Select 
                  value={formData.service} 
                  onValueChange={(value) => setFormData({ ...formData, service: value })}
                >
                  <SelectTrigger id="service">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="azure-firewall">Azure Firewall</SelectItem>
                    <SelectItem value="azure-virtual-desktop">Azure Virtual Desktop</SelectItem>
                    <SelectItem value="azure-application-gateway">Application Gateway</SelectItem>
                    <SelectItem value="custom">Custom Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this template does..."
                rows={2}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="table">Table Name *</Label>
                <Input
                  id="table"
                  value={formData.table}
                  onChange={(e) => setFormData({ ...formData, table: e.target.value })}
                  placeholder="AZFWNetworkRule"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="defaultLimit">Default Limit</Label>
                <Input
                  id="defaultLimit"
                  type="number"
                  value={formData.defaultLimit}
                  onChange={(e) => setFormData({ ...formData, defaultLimit: parseInt(e.target.value) || 100 })}
                  min="1"
                  max="10000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projection">Projection (comma-separated fields)</Label>
              <Input
                id="projection"
                value={formData.projection}
                onChange={(e) => setFormData({ ...formData, projection: e.target.value })}
                placeholder="TimeGenerated, Action, SourceIp, DestinationIp"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aggregation">Aggregation (optional)</Label>
              <Textarea
                id="aggregation"
                value={formData.aggregation}
                onChange={(e) => setFormData({ ...formData, aggregation: e.target.value })}
                placeholder="| summarize Count = count() by Action"
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Fields</Label>
              <Button variant="outline" size="sm" onClick={addField}>
                <Plus className="w-4 h-4 mr-2" />
                Add Field
              </Button>
            </div>
            
            {formData.fields.length === 0 ? (
              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  No fields defined yet. Click "Add Field" to create query parameters.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                {formData.fields.map((field, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="grid gap-2 md:grid-cols-3">
                      <Input
                        placeholder="Field name"
                        value={field.name}
                        onChange={(e) => updateField(index, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="Label"
                        value={field.label}
                        onChange={(e) => updateField(index, 'label', e.target.value)}
                      />
                      <Input
                        placeholder="KQL field"
                        value={field.kqlField}
                        onChange={(e) => updateField(index, 'kqlField', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={field.type} 
                        onValueChange={(value) => updateField(index, 'type', value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="ip">IP Address</SelectItem>
                          <SelectItem value="select">Select</SelectItem>
                          <SelectItem value="timeRange">Time Range</SelectItem>
                        </SelectContent>
                      </Select>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={field.essential}
                          onChange={(e) => updateField(index, 'essential', e.target.checked)}
                        />
                        <span className="text-sm">Essential</span>
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(index, 'required', e.target.checked)}
                        />
                        <span className="text-sm">Required</span>
                      </label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeField(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              {editMode === 'new' ? 'Create Template' : 'Update Template'}
            </Button>
            {editMode === 'edit' && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Template
              </Button>
            )}
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateEditor;