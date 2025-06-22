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
  Code,
  Modal,
  List
} from '@mantine/core';
import {
  IconCopy,
  IconRefresh,
  IconDownload,
  IconMessageCircle,
  IconInfoCircle,
  IconCheck,
  IconApi
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useMantineColorScheme } from '@mantine/core';
import { useSearchParams } from 'react-router-dom';
import BuzzwordIpsumIcon from './BuzzwordIpsumIcon';
import SEOHead from '../../common/SEOHead';
import { generateToolSEO } from '../../../utils/seoUtils';
import toolsConfig from '../../../utils/toolsConfig.json';
import buzzwordData from './data/buzzwords.json';

const BuzzwordIpsumTool = () => {
  const { colorScheme } = useMantineColorScheme();
  const [searchParams] = useSearchParams();
  
  const toolConfig = toolsConfig.find(tool => tool.id === 'buzzword-ipsum');
  const seoData = generateToolSEO(toolConfig);
  
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputFormat, setOutputFormat] = useState('paragraphs');
  const [quantity, setQuantity] = useState(5);
  const [sentenceLength, setSentenceLength] = useState('medium');
  const [apiModalOpened, setApiModalOpened] = useState(false);

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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText).then(() => {
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
      
      notifications.show({
        title: 'Content Copied!',
        message: randomCopyNotification,
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
    
    notifications.show({
      title: 'File Downloaded!',
      message: randomDownloadNotification,
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
              <BuzzwordIpsumIcon size={24} />
            </ThemeIcon>
            <div style={{ flex: 1 }}>
              <Title order={2} size="h1">
                Buzzword Ipsum
              </Title>
              <Text c="dimmed" size="sm">
                Generate corporate buzzword-filled placeholder text for mockups and presentations
              </Text>
            </div>
            <Tooltip label="View API Documentation">
              <ActionIcon 
                variant="light" 
                color="blue"
                size="lg"
                onClick={() => setApiModalOpened(true)}
              >
                <IconApi size={20} />
              </ActionIcon>
            </Tooltip>
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

      {/* API Documentation Modal */}
      <Modal
        opened={apiModalOpened}
        onClose={() => setApiModalOpened(false)}
        title="Buzzword Ipsum API Documentation"
        size="lg"
      >
        <Stack spacing="md">
          <Text>
            Access the Buzzword Ipsum API programmatically to generate corporate buzzwords for your applications.
          </Text>
          
          <Title order={4}>Base URL</Title>
          <Code block>https://buzzwords.russmckendrick.com</Code>
          
          <Title order={4}>Endpoints</Title>
          
          <Stack spacing="sm">
            <div>
              <Text fw={600}>Generate Phrases</Text>
              <Code block>GET /api/phrases?count={'{count}'}</Code>
              <Text size="sm" c="dimmed">Returns an array of buzzword phrases</Text>
            </div>
            
            <div>
              <Text fw={600}>Generate Adjectives</Text>
              <Code block>GET /api/adjectives?count={'{count}'}</Code>
              <Text size="sm" c="dimmed">Returns an array of corporate adjectives</Text>
            </div>
            
            <div>
              <Text fw={600}>Health Check</Text>
              <Code block>GET /api/health</Code>
              <Text size="sm" c="dimmed">Returns API status and version</Text>
            </div>
          </Stack>
          
          <Title order={4}>Parameters</Title>
          <List>
            <List.Item><Code>count</Code> (optional): Number of items to generate (1-100, default: 10)</List.Item>
          </List>
          
          <Title order={4}>Rate Limiting</Title>
          <Text size="sm">
            The API is rate limited to prevent abuse:
          </Text>
          <List size="sm">
            <List.Item>100 requests per minute per IP address</List.Item>
            <List.Item>Protected by Cloudflare's DDoS protection</List.Item>
            <List.Item>Rate limit headers included in responses</List.Item>
          </List>
          
          <Title order={4}>Example Response</Title>
          <Code block>{`{
  "success": true,
  "data": [
    "synergistic paradigm",
    "dynamic optimization",
    "strategic innovation"
  ],
  "count": 3,
  "timestamp": "2024-01-01T12:00:00Z"
}`}</Code>
          
          <Text size="sm" c="dimmed">
            This API is provided free of charge for development and testing purposes.
          </Text>
        </Stack>
      </Modal>

    </Box>
  );
};

export default BuzzwordIpsumTool;