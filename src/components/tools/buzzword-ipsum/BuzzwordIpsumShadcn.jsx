import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  Copy,
  RefreshCw,
  Download,
  MessageCircle,
  Info,
  Check,
  Api
} from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import BuzzwordIpsumIcon from './BuzzwordIpsumIcon';
import SEOHead from '../../common/SEOHead';
import { generateToolSEO } from '../../../utils/seoUtils';
import toolsConfig from '../../../utils/toolsConfig.json';
import buzzwordData from './data/buzzwords.json';

const BuzzwordIpsumShadcn = () => {
  const [searchParams] = useSearchParams();
  
  const toolConfig = toolsConfig.find(tool => tool.id === 'buzzword-ipsum');
  const seoData = generateToolSEO(toolConfig);
  
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputFormat, setOutputFormat] = useState('paragraphs');
  const [quantity, setQuantity] = useState(5);
  const [sentenceLength, setSentenceLength] = useState('medium');
  const [apiModalOpen, setApiModalOpen] = useState(false);

  const getRandomItem = (array) => {
    return array[Math.floor(Math.random() * array.length)];
  };

  const generateBuzzwordSentence = useCallback(() => {
    const { adverbs, verbs, adjectives, nouns } = buzzwordData;
    
    const lengthConfig = {
      short: { min: 3, max: 6 },
      medium: { min: 5, max: 10 },
      long: { min: 8, max: 15 }
    };
    
    const config = lengthConfig[sentenceLength];
    const wordCount = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
    
    const sentence = [];
    
    for (let i = 0; i < wordCount; i++) {
      if (i === 0) {
        sentence.push(getRandomItem(adverbs));
      } else if (i === 1) {
        sentence.push(getRandomItem(verbs));
      } else if (Math.random() < 0.6) {
        sentence.push(getRandomItem(adjectives));
      } else {
        sentence.push(getRandomItem(nouns));
      }
    }
    
    let result = sentence.join(' ');
    result = result.charAt(0).toUpperCase() + result.slice(1);
    
    if (!result.endsWith('.')) {
      result += '.';
    }
    
    return result;
  }, [sentenceLength]);

  const generateBuzzwordPhrase = useCallback(() => {
    const { adjectives, nouns } = buzzwordData;
    return `${getRandomItem(adjectives)} ${getRandomItem(nouns)}`;
  }, []);

  const generateBuzzwordParagraph = useCallback(() => {
    const sentenceCount = Math.floor(Math.random() * 4) + 3;
    const sentences = [];
    
    for (let i = 0; i < sentenceCount; i++) {
      sentences.push(generateBuzzwordSentence());
    }
    
    return sentences.join(' ');
  }, [generateBuzzwordSentence]);

  const generateContent = useCallback(async () => {
    setIsGenerating(true);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let content = [];
    
    for (let i = 0; i < quantity; i++) {
      switch (outputFormat) {
        case 'phrases':
          content.push(generateBuzzwordPhrase());
          break;
        case 'sentences':
          content.push(generateBuzzwordSentence());
          break;
        case 'paragraphs':
          content.push(generateBuzzwordParagraph());
          break;
      }
    }
    
    const separator = outputFormat === 'paragraphs' ? '\n\n' : '\n';
    setGeneratedText(content.join(separator));
    setIsGenerating(false);
    
    // Show witty notification
    const buzzwordNotifications = [
      'Successfully leveraged synergistic buzzwords!',
      'Seamlessly deployed corporate jargon!',
      'Proactively generated strategic content!',
      'Dynamically optimized thought leadership!',
      'Efficiently streamlined paradigm shifts!',
      'Collaboratively innovated disruptive solutions!',
      'Holistically orchestrated value-added deliverables!'
    ];
    const randomNotification = buzzwordNotifications[Math.floor(Math.random() * buzzwordNotifications.length)];
    
    toast.success('Content Generated!', {
      description: randomNotification,
    });
  }, [outputFormat, quantity, generateBuzzwordPhrase, generateBuzzwordSentence, generateBuzzwordParagraph]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      
      // Show witty copy notification
      const copyNotifications = [
        'Successfully leveraged clipboard synergies!',
        'Proactively orchestrated text duplication!',
        'Seamlessly optimized copy-paste workflows!',
        'Dynamically streamlined content portability!',
        'Collaboratively enhanced clipboard utilization!',
        'Holistically deployed copy operations!',
        'Efficiently optimized text distribution channels!'
      ];
      const randomCopyNotification = copyNotifications[Math.floor(Math.random() * copyNotifications.length)];
      
      toast.success('Content Copied!', {
        description: randomCopyNotification,
      });
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const downloadText = () => {
    const blob = new Blob([generatedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buzzword-ipsum-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show witty download notification
    const downloadNotifications = [
      'Successfully deployed file distribution strategies!',
      'Proactively architected document delivery systems!',
      'Seamlessly orchestrated content export workflows!',
      'Holistically optimized file transmission protocols!',
      'Dynamically leveraged download optimization!',
      'Collaboratively streamlined asset deployment!',
      'Efficiently maximized content portability solutions!'
    ];
    const randomDownloadNotification = downloadNotifications[Math.floor(Math.random() * downloadNotifications.length)];
    
    toast.success('File Downloaded!', {
      description: randomDownloadNotification,
    });
  };

  const wordCount = generatedText ? generatedText.split(/\s+/).filter(word => word.length > 0).length : 0;
  const charCount = generatedText.length;

  return (
    <TooltipProvider>
      <SEOHead {...seoData} />
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
                  <BuzzwordIpsumIcon size={32} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Buzzword Ipsum</h1>
                  <p className="text-muted-foreground">
                    Generate corporate buzzword-filled placeholder text for mockups and presentations
                  </p>
                </div>
              </div>
              <Dialog open={apiModalOpen} onOpenChange={setApiModalOpen}>
                <DialogTrigger asChild>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Api className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View API Documentation</p>
                    </TooltipContent>
                  </Tooltip>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Buzzword Ipsum API Documentation</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Access the Buzzword Ipsum API programmatically to generate corporate buzzwords for your applications.
                    </p>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold">Base URL</h4>
                      <div className="p-3 bg-muted rounded-md font-mono text-sm">
                        https://buzzwords.russmckendrick.com
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold">Endpoints</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium">Generate Phrases</p>
                          <div className="p-2 bg-muted rounded text-sm font-mono">
                            GET /api/phrases?count={'{count}'}
                          </div>
                          <p className="text-sm text-muted-foreground">Returns an array of buzzword phrases</p>
                        </div>
                        
                        <div>
                          <p className="font-medium">Generate Adjectives</p>
                          <div className="p-2 bg-muted rounded text-sm font-mono">
                            GET /api/adjectives?count={'{count}'}
                          </div>
                          <p className="text-sm text-muted-foreground">Returns an array of corporate adjectives</p>
                        </div>
                        
                        <div>
                          <p className="font-medium">Health Check</p>
                          <div className="p-2 bg-muted rounded text-sm font-mono">
                            GET /api/health
                          </div>
                          <p className="text-sm text-muted-foreground">Returns API status and version</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold">Parameters</h4>
                      <ul className="text-sm space-y-1">
                        <li><code className="bg-muted px-1 rounded">count</code> (optional): Number of items to generate (1-100, default: 10)</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold">Rate Limiting</h4>
                      <p className="text-sm text-muted-foreground">The API is rate limited to prevent abuse:</p>
                      <ul className="text-sm space-y-1">
                        <li>• 100 requests per minute per IP address</li>
                        <li>• Protected by Cloudflare's DDoS protection</li>
                        <li>• Rate limit headers included in responses</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold">Example Response</h4>
                      <div className="p-3 bg-muted rounded-md font-mono text-xs">
{`{
  "success": true,
  "data": [
    "synergistic paradigm",
    "dynamic optimization",
    "strategic innovation"
  ],
  "count": 3,
  "timestamp": "2024-01-01T12:00:00Z"
}`}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      This API is provided free of charge for development and testing purposes.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Badge variant="secondary">Corporate Speak</Badge>
              <Badge variant="secondary">Professional Jargon</Badge>
              <Badge variant="secondary">Business Buzzwords</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Options Column */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Options</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Output Format</Label>
                <Select value={outputFormat} onValueChange={setOutputFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phrases">Phrases</SelectItem>
                    <SelectItem value="sentences">Sentences</SelectItem>
                    <SelectItem value="paragraphs">Paragraphs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                  min={1}
                  max={20}
                />
                <p className="text-xs text-muted-foreground">
                  Number of {outputFormat} to generate
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Sentence Length</Label>
                <Select 
                  value={sentenceLength} 
                  onValueChange={setSentenceLength}
                  disabled={outputFormat === 'phrases'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (3-6 words)</SelectItem>
                    <SelectItem value="medium">Medium (5-10 words)</SelectItem>
                    <SelectItem value="long">Long (8-15 words)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={generateContent}
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Generate Text
              </Button>
            </CardContent>
          </Card>
          
          {/* Output Column */}
          <div className="lg:col-span-3">
            {generatedText ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Generated Text</h3>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        onClick={copyToClipboard}
                        size="sm"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline"
                            onClick={downloadText}
                            size="sm"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Download as text file</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Card>
                    <CardContent className="pt-4">
                      <Textarea
                        value={generatedText}
                        onChange={(e) => setGeneratedText(e.target.value)}
                        rows={12}
                        className="min-h-[300px] resize-none border-0 focus-visible:ring-0 bg-transparent"
                        style={{ fontSize: '14px', lineHeight: '1.6' }}
                      />
                    </CardContent>
                  </Card>
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Word count: {wordCount}</span>
                    <span>Character count: {charCount}</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Generate some buzzword-filled content to get started!
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default BuzzwordIpsumShadcn;