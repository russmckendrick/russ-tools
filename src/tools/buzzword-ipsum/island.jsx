import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  Copy,
  RefreshCw,
  Download,
  MessageCircle,
  Code
} from 'lucide-react';
import { toast } from 'sonner';
import { copyText, downloadFile } from '@/core';
import buzzwordData from './data/buzzwords.json';

const BuzzwordIpsumTool = () => {
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
    if (await copyText(generatedText)) {
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
    } else {
      toast.error('Failed to copy to clipboard');
    }
  };

  const downloadText = () => {
    downloadFile(generatedText, `buzzword-ipsum-${Date.now()}.txt`, 'text/plain');

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
      <div className="space-y-6">
        <Dialog open={apiModalOpen} onOpenChange={setApiModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Buzzword Ipsum API Documentation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-body-sm text-muted-foreground">
                Access the Buzzword Ipsum API programmatically to generate corporate buzzwords for your applications.
              </p>
              
              <div className="space-y-2">
                <h4 className="font-semibold">Base URL</h4>
                <div className="p-3 bg-muted rounded-md font-mono text-data-md">
                  https://buzzwords.russ.tools
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Endpoints</h4>

                <div className="space-y-3">
                  <div>
                    <p className="font-medium">Generate text</p>
                    <div className="p-2 bg-muted rounded text-data-md font-mono [overflow-wrap:anywhere]">
                      GET /generate?type={'{type}'}&count={'{count}'}
                    </div>
                    <p className="text-body-sm text-muted-foreground">
                      Returns phrases, sentences or paragraphs, or single words of one kind. Also accepts POST with the same fields as JSON.
                    </p>
                  </div>

                  <div>
                    <p className="font-medium">Word lists</p>
                    <div className="p-2 bg-muted rounded text-data-md font-mono [overflow-wrap:anywhere]">
                      GET /words?type={'{type}'}&count={'{count}'}
                    </div>
                    <p className="text-body-sm text-muted-foreground">Returns raw words from the lists the generator draws on</p>
                  </div>

                  <div>
                    <p className="font-medium">Health check</p>
                    <div className="p-2 bg-muted rounded text-data-md font-mono">
                      GET /health
                    </div>
                    <p className="text-body-sm text-muted-foreground">Returns API status, version and word counts</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Parameters</h4>
                <ul className="text-body-sm space-y-1">
                  <li>
                    <code className="bg-muted px-1 rounded">type</code> on <code className="bg-muted px-1 rounded">/generate</code>:{' '}
                    <code className="bg-muted px-1 rounded">phrase</code> (default), <code className="bg-muted px-1 rounded">sentences</code>,{' '}
                    <code className="bg-muted px-1 rounded">paragraphs</code>, <code className="bg-muted px-1 rounded">adverbs</code>,{' '}
                    <code className="bg-muted px-1 rounded">adjectives</code>, <code className="bg-muted px-1 rounded">nouns</code> or{' '}
                    <code className="bg-muted px-1 rounded">verbs</code>
                  </li>
                  <li>
                    <code className="bg-muted px-1 rounded">count</code> on <code className="bg-muted px-1 rounded">/generate</code>: 1 to 50, default 1
                  </li>
                  <li>
                    <code className="bg-muted px-1 rounded">type</code> on <code className="bg-muted px-1 rounded">/words</code>: optional;{' '}
                    <code className="bg-muted px-1 rounded">adverbs</code>, <code className="bg-muted px-1 rounded">adjectives</code>,{' '}
                    <code className="bg-muted px-1 rounded">nouns</code> or <code className="bg-muted px-1 rounded">verbs</code>
                  </li>
                  <li>
                    <code className="bg-muted px-1 rounded">count</code> on <code className="bg-muted px-1 rounded">/words</code>: 1 to 100, default 10
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Caching</h4>
                <p className="text-body-sm text-muted-foreground">
                  Responses are cacheable for five minutes, so repeating a request inside that window may return the same text.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Example Response</h4>
                <div className="p-3 bg-muted rounded-md font-mono text-data-sm whitespace-pre-wrap [overflow-wrap:anywhere]">
{`GET /generate?type=phrase&count=2

{
  "success": true,
  "timestamp": "2026-11-14T10:11:33.672Z",
  "type": "phrases",
  "count": 2,
  "data": [
    "edge-computed exploit high standards alerting mechanisms",
    "seamlessly orchestrate scalable delivery pipelines"
  ]
}`}
                </div>
              </div>

              <p className="text-body-sm text-muted-foreground">
                This API is provided free of charge for development and testing purposes.
              </p>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Options Column */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <h3 className="text-title-sm">Options</h3>
                <Button variant="outline" size="sm" onClick={() => setApiModalOpen(true)}>
                  <Code className="w-4 h-4 mr-2" />
                  API Usage
                </Button>
              </div>
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
                <p className="text-body-sm text-muted-foreground">
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
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin-ccw" />
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
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                    <h3 className="text-title-sm">Generated Text</h3>
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
                        className="min-h-[300px] resize-none border-0 focus-visible:ring-0 bg-transparent font-sans text-body-md"
                      />
                    </CardContent>
                  </Card>
                  
                  <div className="flex justify-between text-data-sm font-mono text-muted-foreground">
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

export default BuzzwordIpsumTool;