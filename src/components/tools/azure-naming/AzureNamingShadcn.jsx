import React from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Separator } from '../../ui/separator';
import { 
  Cloud, 
  Edit, 
  History, 
  Info, 
  Share, 
  ExternalLink
} from 'lucide-react';
import SEOHead from '../../common/SEOHead';
import { generateToolSEO } from '../../../utils/seoUtils';
import toolsConfig from '../../../utils/toolsConfig.json';
import { useAzureNamingShadcn } from './hooks/useAzureNamingShadcn';
import { useAzureNamingContextShadcn } from './context/AzureNamingContextShadcn';
import { useSearchParams } from 'react-router-dom';
import { copyShareableURL, parseConfigFromURL } from '../../../utils/sharelink';
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

  // Get tool configuration for SEO
  const toolConfig = toolsConfig.find(tool => tool.id === 'azure-naming');
  const seoData = generateToolSEO(toolConfig);

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

    const success = await copyShareableURL(config);
    if (success) {
      toast.success('Configuration Shared', {
        description: 'Shareable link has been copied to your clipboard',
        icon: <Share size={16} />
      });
    }
  };

  return (
    <>
      <SEOHead {...seoData} />
      <Card className="w-full">
        <CardHeader className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400">
                <Cloud size={28} />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2xl font-semibold">
                  Azure Resource Naming Tool
                </CardTitle>
                <CardDescription className="text-base">
                  Generate consistent, compliant Azure resource names following best practices
                </CardDescription>
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={handleShareConfiguration}
              disabled={!formState.resourceType.length || !formState.workload}
              className="gap-2"
            >
              <Share size={16} />
              Copy Configuration Share URL
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="builder" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
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
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Resource Types
                      </Badge>
                      <span className="text-xs text-muted-foreground">
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
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Required
                    </Badge>
                    <span className="text-xs text-muted-foreground">
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
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      Optional
                    </Badge>
                    <span className="text-xs text-muted-foreground">
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
              <Alert className="bg-green-50 border-green-200 text-green-800">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Access your previously generated and saved resource names
                </AlertDescription>
              </Alert>
              <NamingHistoryShadcn />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
};

export default AzureNamingShadcn;