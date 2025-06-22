import React, { useState, useCallback, useEffect } from 'react';
import {
  Paper,
  Stack,
  Title,
  ThemeIcon,
  Group,
  Text,
  Alert,
  Badge,
  Button,
  NumberInput,
  Grid,
  Card,
  ActionIcon,
  Select,
  Textarea,
  Divider,
  Box,
  Tooltip,
  Code
} from '@mantine/core';
import {
  IconCopy,
  IconRefresh,
  IconDownload,
  IconMessageCircle,
  IconInfoCircle,
  IconCheck
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useMantineColorScheme } from '@mantine/core';
import { useSearchParams } from 'react-router-dom';
import BuzzwordPlaceholderIcon from './BuzzwordPlaceholderIcon';
import SEOHead from '../../common/SEOHead';
import { generateToolSEO } from '../../../utils/seoUtils';
import toolsConfig from '../../../utils/toolsConfig.json';
import buzzwordData from './data/buzzwords.json';

const BuzzwordPlaceholderTool = () => {
  const { colorScheme } = useMantineColorScheme();
  const [searchParams] = useSearchParams();
  
  const toolConfig = toolsConfig.find(tool => tool.id === 'buzzword-placeholder');
  const seoData = generateToolSEO(toolConfig);
  
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputFormat, setOutputFormat] = useState('paragraphs');
  const [quantity, setQuantity] = useState(5);
  const [sentenceLength, setSentenceLength] = useState('medium');
  const [apiMode, setApiMode] = useState(false);

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
    
    notifications.show({
      title: 'Content Generated!',
      message: randomNotification,
      color: 'orange',
      icon: <IconCheck size={16} />
    });
  }, [outputFormat, quantity, generateBuzzwordPhrase, generateBuzzwordSentence, generateBuzzwordParagraph]);

  // API content generation (without notifications)
  const generateApiContent = useCallback((format, count, length) => {
    let content = [];
    
    // Use the length parameter for sentence generation
    const tempSentenceLength = length || 'medium';
    
    for (let i = 0; i < count; i++) {
      switch (format) {
        case 'phrases':
          content.push(generateBuzzwordPhrase());
          break;
        case 'sentences':
          const { adverbs, verbs, adjectives, nouns } = buzzwordData;
          const lengthConfig = {
            short: { min: 3, max: 6 },
            medium: { min: 5, max: 10 },
            long: { min: 8, max: 15 }
          };
          const config = lengthConfig[tempSentenceLength];
          const wordCount = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
          const sentence = [];
          for (let j = 0; j < wordCount; j++) {
            if (j === 0) {
              sentence.push(getRandomItem(adverbs));
            } else if (j === 1) {
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
          content.push(result);
          break;
        case 'paragraphs':
          const sentenceCount = Math.floor(Math.random() * 4) + 3;
          const sentences = [];
          for (let j = 0; j < sentenceCount; j++) {
            // Generate sentence directly for paragraph
            const { adverbs: advs, verbs: vrbs, adjectives: adjs, nouns: nns } = buzzwordData;
            const pConfig = lengthConfig[tempSentenceLength];
            const pWordCount = Math.floor(Math.random() * (pConfig.max - pConfig.min + 1)) + pConfig.min;
            const pSentence = [];
            for (let k = 0; k < pWordCount; k++) {
              if (k === 0) {
                pSentence.push(getRandomItem(advs));
              } else if (k === 1) {
                pSentence.push(getRandomItem(vrbs));
              } else if (Math.random() < 0.6) {
                pSentence.push(getRandomItem(adjs));
              } else {
                pSentence.push(getRandomItem(nns));
              }
            }
            let pResult = pSentence.join(' ');
            pResult = pResult.charAt(0).toUpperCase() + pResult.slice(1);
            if (!pResult.endsWith('.')) {
              pResult += '.';
            }
            sentences.push(pResult);
          }
          content.push(sentences.join(' '));
          break;
      }
    }
    
    return content;
  }, [generateBuzzwordPhrase]);

  // Check for API mode on component mount
  useEffect(() => {
    const isApi = searchParams.has('api');
    if (isApi) {
      setApiMode(true);
      
      // Parse API parameters with defaults
      const apiOutput = searchParams.get('output') || 'paragraphs';
      const apiQuantity = Math.min(Math.max(parseInt(searchParams.get('quantity')) || 5, 1), 20);
      const apiLength = searchParams.get('length') || 'medium';
      
      // Validate parameters
      const validFormats = ['phrases', 'sentences', 'paragraphs'];
      const validLengths = ['short', 'medium', 'long'];
      
      const format = validFormats.includes(apiOutput) ? apiOutput : 'paragraphs';
      const length = validLengths.includes(apiLength) ? apiLength : 'medium';
      
      // Generate content
      const content = generateApiContent(format, apiQuantity, length);
      
      // Return JSON response
      const response = {
        success: true,
        data: {
          content: content,
          format: format,
          quantity: apiQuantity,
          length: length,
          generated_at: new Date().toISOString()
        },
        meta: {
          tool: 'buzzword-ipsum',
          version: '1.0',
          total_items: content.length,
          api_docs: 'https://www.russ.tools/buzzword-ipsum/?docs'
        }
      };
      
      // Replace the page content with JSON
      document.body.innerHTML = `<pre style="font-family: monospace; white-space: pre-wrap; padding: 20px; background: #f5f5f5; margin: 0;">${JSON.stringify(response, null, 2)}</pre>`;
      document.title = 'Buzzword Ipsum API Response';
      
      // Set content type header if possible
      if (typeof window !== 'undefined' && window.history) {
        // We can't actually set headers in the browser, but we format as JSON
        console.log('API Response:', response);
      }
    }
  }, [searchParams, generateApiContent]);

  // Early return for API mode
  if (apiMode) {
    return null;
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText).then(() => {
      notifications.show({
        title: 'Copied!',
        message: 'Buzzword text copied to clipboard',
        color: 'green',
        icon: <IconCheck size={16} />
      });
    });
  };

  const downloadText = () => {
    const blob = new Blob([generatedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buzzword-placeholder-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    notifications.show({
      title: 'Downloaded!',
      message: 'Buzzword text file downloaded',
      color: 'blue',
      icon: <IconCheck size={16} />
    });
  };

  return (
    <Box>
      <SEOHead {...seoData} />
      
      <Paper withBorder shadow="md" p="xl" radius="md">
        <Stack spacing="lg">
          <Group align="center" spacing="md">
            <ThemeIcon 
              size={48} 
              radius="md" 
              variant="gradient" 
              gradient={{ from: 'orange', to: 'red' }}
            >
              <BuzzwordPlaceholderIcon size={24} />
            </ThemeIcon>
            <div>
              <Title order={2} size="h1">
                Buzzword Ipsum
              </Title>
              <Text c="dimmed" size="sm">
                Generate corporate buzzword-filled placeholder text for mockups and presentations
              </Text>
            </div>
          </Group>

          <Group spacing="lg">
            <Badge variant="light" color="orange">
              Corporate Speak
            </Badge>
            <Badge variant="light" color="red">
              Professional Jargon
            </Badge>
            <Badge variant="light" color="yellow">
              Business Buzzwords
            </Badge>
          </Group>

        </Stack>
      </Paper>

      <Grid mt="lg">
        {/* Options Column */}
        <Grid.Col span={3}>
          <Paper withBorder shadow="sm" p="lg" radius="md" h="fit-content">
            <Stack spacing="md">
              <Title order={3} size="h3">
                Options
              </Title>
              
              <Select
                label="Output Format"
                value={outputFormat}
                onChange={setOutputFormat}
                data={[
                  { value: 'phrases', label: 'Phrases' },
                  { value: 'sentences', label: 'Sentences' },
                  { value: 'paragraphs', label: 'Paragraphs' }
                ]}
              />
              
              <NumberInput
                label="Quantity"
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={20}
                description={`Number of ${outputFormat} to generate`}
              />
              
              <Select
                label="Sentence Length"
                value={sentenceLength}
                onChange={setSentenceLength}
                data={[
                  { value: 'short', label: 'Short (3-6 words)' },
                  { value: 'medium', label: 'Medium (5-10 words)' },
                  { value: 'long', label: 'Long (8-15 words)' }
                ]}
                disabled={outputFormat === 'phrases'}
              />

              <Button 
                leftIcon={<IconRefresh size={16} />}
                onClick={generateContent}
                loading={isGenerating}
                variant="filled"
                color="orange"
                fullWidth
                mt="md"
              >
                Generate Text
              </Button>
            </Stack>
          </Paper>
        </Grid.Col>
        
        {/* Output Column */}
        <Grid.Col span={9}>
          {generatedText ? (
            <Paper withBorder shadow="sm" p="lg" radius="md">
              <Stack spacing="md">
                <Group justify="space-between" align="center">
                  <Title order={3} size="h3">
                    Generated Text
                  </Title>
                  <Group spacing="xs">
                    <Button 
                      leftIcon={<IconCopy size={16} />}
                      variant="light"
                      color="blue"
                      onClick={copyToClipboard}
                      size="sm"
                    >
                      Copy
                    </Button>
                    <Tooltip label="Download as text file">
                      <ActionIcon 
                        variant="subtle" 
                        color="green"
                        onClick={downloadText}
                      >
                        <IconDownload size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Group>
                
                <Divider />
                
                <Card withBorder p="md" radius="sm" bg={colorScheme === 'dark' ? 'dark.8' : 'gray.0'}>
                  <Textarea
                    value={generatedText}
                    onChange={(e) => setGeneratedText(e.target.value)}
                    autosize
                    minRows={8}
                    maxRows={25}
                    variant="unstyled"
                    styles={{
                      input: {
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        lineHeight: 1.6,
                        backgroundColor: 'transparent',
                        color: 'inherit'
                      }
                    }}
                  />
                </Card>
                
                <Text size="xs" c="dimmed">
                  Word count: {generatedText.split(/\s+/).filter(word => word.length > 0).length} | 
                  Character count: {generatedText.length}
                </Text>
              </Stack>
            </Paper>
          ) : (
            <Paper withBorder shadow="sm" p="lg" radius="md" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text c="dimmed" ta="center">
                Generate some buzzword-filled content to get started!
              </Text>
            </Paper>
          )}
        </Grid.Col>
      </Grid>

    </Box>
  );
};

export default BuzzwordPlaceholderTool;