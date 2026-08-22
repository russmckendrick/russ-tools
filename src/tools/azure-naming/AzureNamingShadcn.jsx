import React from 'react';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ToolAction } from '@/components/ui/tool-actions';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Cloud, 
  Edit, 
  History, 
  Info, 
  Share
} from 'lucide-react';
import { useAzureNamingShadcn } from './hooks/useAzureNamingShadcn';
import { useAzureNamingContextShadcn } from './context/AzureNamingContextShadcn';
import { useSearchParams } from 'react-router-dom';
import { generateShareableURL, parseConfigFromURL, copyText } from '@/core';
import ResourceTypeSelectorShadcn from './ResourceTypeSelectorShadcn';
import ValidationIndicatorShadcn from './ValidationIndicatorShadcn';
import ResultsDisplayShadcn from './ResultsDisplayShadcn';
import NamingHistoryShadcn from './NamingHistoryShadcn';
import NamingFormShadcn from './NamingFormShadcn';
import { toast } from 'sonner';

const AzureNamingShadcn = () => {
  const {
    formState,
    validationState,
    updateFormState,
    generateName,
    setFormState
  } = useAzureNamingShadcn();
  const { isLoading } = useAzureNamingContextShadcn();
  const [searchParams] = useSearchParams();

  // Load configuration from URL on mount
  React.useEffect(() => {
    const config = parseConfigFromURL(searchParams);
    if (config && config.formState) {
      setFormState(config.formState);
      toast.success('Configuration Loaded', {
        description: 'Azure naming configuration has been loaded from URL'
      });
    }
  }, [searchParams, setFormState]);

  // Share configuration
  const handleShareConfiguration = async () => {
    if (!formState.resourceType.length || !formState.workload) {
      toast.warning('Incomplete Configuration', {
        description: 'Please fill in at least the resource type and workload before sharing'
      });
      return;
    }

    const config = {
      formState: formState
    };

    const shareableUrl = generateShareableURL(config);
    const success = shareableUrl ? await copyText(shareableUrl) : false;
    if (success) {
      toast.success('Configuration Shared', {
        description: 'Shareable link has been copied to your clipboard',
        icon: <Share size={16} />
      });
    }
  };

  return (
    <>
      <ToolAction>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShareConfiguration}
          disabled={!formState.resourceType.length || !formState.workload}
        >
          <Share size={16} className="mr-2" />
          Copy Configuration Share URL
        </Button>
      </ToolAction>

      <Tabs defaultValue="builder" className="space-y-6">
            <TabsList className="grid h-auto w-full grid-cols-1 sm:h-10 sm:grid-cols-3">
              <TabsTrigger value="builder" className="gap-2">
                <Edit size={16} />
                Name Builder
              </TabsTrigger>
              <TabsTrigger value="results" className="gap-2">
                <Cloud size={16} />
                Generated Names
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History size={16} />
                Saved Names
              </TabsTrigger>
            </TabsList>

            <TabsContent value="builder" className="space-y-6">
              {/* Resource Type Selection */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-info-subtle text-info border-info/40">
                        Resource Types
                      </Badge>
                      <span className="text-body-sm text-muted-foreground">
                        Select Azure resources to name
                      </span>
                    </div>
                    <ResourceTypeSelectorShadcn
                      formState={formState}
                      updateFormState={updateFormState}
                      validationState={validationState}
                      showAsterisk={!!validationState.errors.resourceType}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Naming Configuration */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-success-subtle text-success border-success/40">
                      Required
                    </Badge>
                    <span className="text-body-sm text-muted-foreground">
                      Essential naming components
                    </span>
                  </div>
                  <NamingFormShadcn 
                    formState={formState}
                    updateFormState={updateFormState}
                    validationState={validationState}
                    generateName={generateName}
                    column="left"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-warning-subtle text-warning border-warning/40">
                      Optional
                    </Badge>
                    <span className="text-body-sm text-muted-foreground">
                      Additional naming options
                    </span>
                  </div>
                  <NamingFormShadcn 
                    formState={formState}
                    updateFormState={updateFormState}
                    validationState={validationState}
                    generateName={generateName}
                    column="right"
                  />
                </div>
              </div>

              {/* Generate Button & Validation */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <Button
                      size="lg"
                      onClick={generateName}
                      disabled={isLoading}
                      className="w-full gap-2"
                    >
                      <Cloud size={18} />
                      Generate Azure Resource Names
                    </Button>
                    <ValidationIndicatorShadcn 
                      formState={formState} 
                      validationState={validationState} 
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Review your generated Azure resource names and copy them for use
                </AlertDescription>
              </Alert>
              <ResultsDisplayShadcn
                formState={formState}
                validationState={validationState}
              />
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Alert className="bg-success-subtle border-success/40 text-success">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Access your previously generated and saved resource names
                </AlertDescription>
              </Alert>
              <NamingHistoryShadcn />
            </TabsContent>
          </Tabs>
    </>
  );
};

export default AzureNamingShadcn;
