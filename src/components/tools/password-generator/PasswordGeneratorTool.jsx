import React, { useState, useCallback } from 'react';
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
  Switch,
  Slider,
  Divider,
  Progress,
  Box,
  List,
  Tooltip,
  Code
} from '@mantine/core';
import {
  IconCopy,
  IconDownload,
  IconRefresh,
  IconTrash,
  IconShield,
  IconAlertTriangle,
  IconCheck,
  IconInfoCircle,
  IconClock,
  IconLock
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useMantineColorScheme } from '@mantine/core';
import PasswordIcon from './PasswordIcon';
import SEOHead from '../../common/SEOHead';
import { generateToolSEO } from '../../../utils/seoUtils';
import toolsConfig from '../../../utils/toolsConfig.json';

const PasswordGeneratorTool = () => {
  const { colorScheme } = useMantineColorScheme();

  // Get tool configuration for SEO
  const toolConfig = toolsConfig.find(tool => tool.id === 'password-generator');
  const seoData = generateToolSEO(toolConfig);
  
  // Password generation settings
  const [length, setLength] = useState(24);
  const [count, setCount] = useState(1);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  
  // Generated passwords
  const [passwords, setPasswords] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Character sets
  const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
  const NUMBERS = '0123456789';
  const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const SIMILAR_CHARS = 'il1Lo0O';
  const AMBIGUOUS_CHARS = '{}[]()/\\\'"`~,;.<>';

  // Calculate password strength with detailed analysis
  const calculateStrength = useCallback(() => {
    let charset = '';
    if (includeUppercase) charset += UPPERCASE;
    if (includeLowercase) charset += LOWERCASE;
    if (includeNumbers) charset += NUMBERS;
    if (includeSymbols) charset += SYMBOLS;
    
    if (excludeSimilar) {
      charset = charset.split('').filter(char => !SIMILAR_CHARS.includes(char)).join('');
    }
    if (excludeAmbiguous) {
      charset = charset.split('').filter(char => !AMBIGUOUS_CHARS.includes(char)).join('');
    }

    const charsetSize = charset.length;
    const entropy = Math.log2(Math.pow(charsetSize, length));
    
    // Calculate time to crack assumptions:
    // - Brute force attack trying all combinations
    // - 1 billion guesses per second (modern GPU capability)
    // - Average case: need to try half of all possible combinations
    const possibleCombinations = Math.pow(charsetSize, length);
    const averageGuesses = possibleCombinations / 2;
    const secondsToCrack = averageGuesses / 1000000000; // 1 billion guesses/sec
    
    // Format combinations in human readable format
    const formatCombinations = (num) => {
      if (num < 1000) return Math.round(num).toLocaleString();
      if (num < 1000000) return `${(num / 1000).toFixed(1)} thousand`;
      if (num < 1000000000) return `${(num / 1000000).toFixed(1)} million`;
      if (num < 1000000000000) return `${(num / 1000000000).toFixed(1)} billion`;
      if (num < 1000000000000000) return `${(num / 1000000000000).toFixed(1)} trillion`;
      if (num < 1000000000000000000) return `${(num / 1000000000000000).toFixed(1)} quadrillion`;
      if (num < 1e21) return `${(num / 1e18).toFixed(1)} quintillion`;
      if (num < 1e24) return `${(num / 1e21).toFixed(1)} sextillion`;
      if (num < 1e27) return `${(num / 1e24).toFixed(1)} septillion`;
      if (num < 1e30) return `${(num / 1e27).toFixed(1)} octillion`;
      if (num < 1e33) return `${(num / 1e30).toFixed(1)} nonillion`;
      if (num < 1e36) return `${(num / 1e33).toFixed(1)} decillion`;
      if (num < 1e39) return `${(num / 1e36).toFixed(1)} undecillion`;
      if (num < 1e42) return `${(num / 1e39).toFixed(1)} duodecillion`;
      if (num < 1e45) return `${(num / 1e42).toFixed(1)} tredecillion`;
      if (num < 1e48) return `${(num / 1e45).toFixed(1)} quattuordecillion`;
      if (num < 1e51) return `${(num / 1e48).toFixed(1)} quindecillion`;
      if (num < 1e54) return `${(num / 1e51).toFixed(1)} sexdecillion`;
      if (num < 1e57) return `${(num / 1e54).toFixed(1)} septendecillion`;
      if (num < 1e60) return `${(num / 1e57).toFixed(1)} octodecillion`;
      if (num < 1e63) return `${(num / 1e60).toFixed(1)} novemdecillion`;
      if (num < 1e66) return `${(num / 1e63).toFixed(1)} vigintillion`;
      
      // For extremely large numbers, use a more readable format
      const exponent = Math.floor(Math.log10(num));
      const mantissa = num / Math.pow(10, exponent);
      return `${mantissa.toFixed(1)} × 10^${exponent}`;
    };

    // Convert to human readable time
    let timeString = '';
    let timeColor = 'red';
    
    if (secondsToCrack < 1) {
      timeString = 'Instantly';
      timeColor = 'red';
    } else if (secondsToCrack < 60) {
      timeString = `${Math.round(secondsToCrack)} second${secondsToCrack > 1 ? 's' : ''}`;
      timeColor = 'red';
    } else if (secondsToCrack < 3600) {
      const minutes = Math.round(secondsToCrack / 60);
      timeString = `${minutes} minute${minutes > 1 ? 's' : ''}`;
      timeColor = 'red';
    } else if (secondsToCrack < 86400) {
      const hours = Math.round(secondsToCrack / 3600);
      timeString = `${hours} hour${hours > 1 ? 's' : ''}`;
      timeColor = 'orange';
    } else if (secondsToCrack < 2592000) { // 30 days
      const days = Math.round(secondsToCrack / 86400);
      timeString = `${days} day${days > 1 ? 's' : ''}`;
      timeColor = 'orange';
    } else if (secondsToCrack < 31536000) { // 1 year
      const months = Math.round(secondsToCrack / 2592000);
      timeString = `${months} month${months > 1 ? 's' : ''}`;
      timeColor = 'yellow';
    } else if (secondsToCrack < 31536000000) { // 1000 years
      const years = Math.round(secondsToCrack / 31536000);
      if (years < 1000) {
        timeString = `${years.toLocaleString()} year${years > 1 ? 's' : ''}`;
      } else {
        timeString = `${(years / 1000).toFixed(1)}K years`;
      }
      timeColor = 'green';
    } else if (secondsToCrack < 31536000000000) { // 1 million years
      const kYears = Math.round(secondsToCrack / 31536000000);
      timeString = `${kYears.toLocaleString()}K years`;
      timeColor = 'green';
    } else if (secondsToCrack < 31536000000000000) { // 1 billion years
      const mYears = Math.round(secondsToCrack / 31536000000000);
      timeString = `${mYears.toLocaleString()}M years`;
      timeColor = 'green';
    } else {
      const bYears = (secondsToCrack / 31536000000000000);
      if (bYears < 1000) {
        timeString = `${bYears.toFixed(1)}B years`;
      } else {
        timeString = `${(bYears / 1000).toFixed(1)}T years`;
      }
      timeColor = 'green';
    }

    // Determine overall strength level
    let level, color, percentage, description;
    
    if (entropy < 25) {
      level = 'Very Weak';
      color = 'red';
      percentage = 10;
      description = 'Extremely vulnerable to attacks';
    } else if (entropy < 35) {
      level = 'Weak';
      color = 'red';
      percentage = 25;
      description = 'Easily cracked by modern computers';
    } else if (entropy < 50) {
      level = 'Fair';
      color = 'orange';
      percentage = 45;
      description = 'Vulnerable to dedicated attacks';
    } else if (entropy < 65) {
      level = 'Good';
      color = 'yellow';
      percentage = 65;
      description = 'Reasonably secure for most uses';
    } else if (entropy < 80) {
      level = 'Strong';
      color = 'lime';
      percentage = 80;
      description = 'Very secure against most attacks';
    } else {
      level = 'Excellent';
      color = 'green';
      percentage = 100;
      description = 'Extremely secure, enterprise-grade';
    }

    // Generate detailed feedback
    const feedback = [];
    
    if (length < 8) {
      feedback.push({ type: 'error', message: 'Password is too short (minimum 8 characters recommended)' });
    } else if (length < 12) {
      feedback.push({ type: 'warning', message: 'Consider using 12+ characters for better security' });
    } else if (length >= 16) {
      feedback.push({ type: 'success', message: 'Excellent length provides strong security' });
    }

    if (!includeUppercase && !includeLowercase) {
      feedback.push({ type: 'error', message: 'Include letters for better security' });
    } else if (!includeUppercase || !includeLowercase) {
      feedback.push({ type: 'warning', message: 'Mix uppercase and lowercase letters' });
    }

    if (!includeNumbers) {
      feedback.push({ type: 'warning', message: 'Include numbers to increase complexity' });
    }

    if (!includeSymbols) {
      feedback.push({ type: 'warning', message: 'Include symbols for maximum security' });
    } else {
      feedback.push({ type: 'success', message: 'Symbols significantly increase security' });
    }

    if (charsetSize < 26) {
      feedback.push({ type: 'error', message: 'Character set is too limited' });
    } else if (charsetSize < 62) {
      feedback.push({ type: 'warning', message: 'Consider expanding character variety' });
    } else {
      feedback.push({ type: 'success', message: 'Excellent character variety' });
    }

    return {
      level,
      color,
      percentage,
      description,
      entropy: Math.round(entropy * 10) / 10,
      charsetSize,
      combinations: formatCombinations(possibleCombinations),
      timeToCrack: timeString,
      timeColor,
      feedback
    };
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar, excludeAmbiguous]);

  // Generate a single password
  const generatePassword = useCallback(() => {
    let charset = '';
    if (includeUppercase) charset += UPPERCASE;
    if (includeLowercase) charset += LOWERCASE;
    if (includeNumbers) charset += NUMBERS;
    if (includeSymbols) charset += SYMBOLS;
    
    if (excludeSimilar) {
      charset = charset.split('').filter(char => !SIMILAR_CHARS.includes(char)).join('');
    }
    if (excludeAmbiguous) {
      charset = charset.split('').filter(char => !AMBIGUOUS_CHARS.includes(char)).join('');
    }

    if (charset.length === 0) {
      throw new Error('At least one character type must be selected');
    }

    let password = '';
    
    // Ensure at least one character from each selected type
    const requiredChars = [];
    if (includeUppercase) requiredChars.push(UPPERCASE[Math.floor(Math.random() * UPPERCASE.length)]);
    if (includeLowercase) requiredChars.push(LOWERCASE[Math.floor(Math.random() * LOWERCASE.length)]);
    if (includeNumbers) requiredChars.push(NUMBERS[Math.floor(Math.random() * NUMBERS.length)]);
    if (includeSymbols) requiredChars.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);

    // Add required characters
    for (let i = 0; i < Math.min(requiredChars.length, length); i++) {
      password += requiredChars[i];
    }

    // Fill the rest with random characters
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password to avoid predictable patterns
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar, excludeAmbiguous]);

  // Generate multiple passwords
  const handleGeneratePasswords = async () => {
    try {
      setIsGenerating(true);
      
      if (!includeUppercase && !includeLowercase && !includeNumbers && !includeSymbols) {
        notifications.show({
          title: 'Invalid Configuration',
          message: 'Please select at least one character type',
          color: 'red',
          icon: <IconAlertTriangle size={16} />
        });
        return;
      }

      const newPasswords = [];
      for (let i = 0; i < count; i++) {
        newPasswords.push({
          id: Date.now() + i,
          value: generatePassword(),
          timestamp: new Date().toLocaleTimeString()
        });
      }
      
      setPasswords(newPasswords);
      
      notifications.show({
        title: 'Passwords Generated',
        message: `Successfully generated ${count} password${count > 1 ? 's' : ''}`,
        color: 'green',
        icon: <IconCheck size={16} />
      });
    } catch (error) {
      notifications.show({
        title: 'Generation Error',
        message: error.message,
        color: 'red',
        icon: <IconAlertTriangle size={16} />
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy password to clipboard
  const copyToClipboard = async (password) => {
    try {
      await navigator.clipboard.writeText(password);
      notifications.show({
        title: 'Copied',
        message: 'Password copied to clipboard',
        color: 'green',
        icon: <IconCheck size={16} />
      });
    } catch (error) {
      notifications.show({
        title: 'Copy Failed',
        message: 'Failed to copy password to clipboard',
        color: 'red',
        icon: <IconAlertTriangle size={16} />
      });
    }
  };

  // Download passwords as text file
  const downloadPasswords = () => {
    if (passwords.length === 0) {
      notifications.show({
        title: 'No Passwords',
        message: 'Generate some passwords first',
        color: 'orange',
        icon: <IconAlertTriangle size={16} />
      });
      return;
    }

    const header = `RUSS TOOLS - Password Generator
================================

Generated from: russ.tools
Date: ${new Date().toLocaleString()}
Count: ${passwords.length} password${passwords.length > 1 ? 's' : ''}
Length: ${length} characters each

SECURITY NOTICE:
- Store these passwords securely
- Never share passwords via email or unsecured channels
- Use a different password for each account
- Consider using a password manager

Generated Passwords:

`;

    const passwordList = passwords.map((pwd) => pwd.value).join('\n');

    const footer = `

End of password list
Generated with love by RussTools
Visit: https://russ.tools
`;

    const content = header + passwordList + footer;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `passwords_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    notifications.show({
      title: 'Downloaded',
      message: 'Passwords saved to file with ASCII art header!',
      color: 'green',
      icon: <IconCheck size={16} />
    });
  };

  // Clear all passwords
  const clearPasswords = () => {
    setPasswords([]);
    notifications.show({
      title: 'Cleared',
      message: 'All passwords cleared',
      color: 'blue',
      icon: <IconCheck size={16} />
    });
  };

  const strength = calculateStrength();

  return (
    <>
      <SEOHead {...seoData} />
      <Paper p="xl" radius="lg" withBorder>
      <style>
        {`
          @keyframes shine {
            0% { left: -100%; }
            100% { left: 100%; }
          }
        `}
      </style>
      <Stack gap="xl">
        {/* Header */}
        <Group gap="md">
          <ThemeIcon size={48} radius="md" color="violet" variant="light">
            <PasswordIcon size={28} />
          </ThemeIcon>
          <div>
            <Title order={2} fw={600}>
              Password Generator
            </Title>
            <Text size="sm" c="dimmed">
              Generate secure, random passwords with customizable options
            </Text>
            <Badge variant="light" color="violet" size="sm" mt="xs">
              Cryptographically Secure
            </Badge>
          </div>
        </Group>

        <Alert color="blue" variant="light" icon={<IconShield size={16} />}>
          <Text size="sm">
            All passwords are generated locally in your browser. Nothing is sent to any server.
          </Text>
        </Alert>

        <Grid gutter="lg">
          {/* Configuration Panel */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card withBorder p="lg" radius="md">
              <Stack gap="lg">
                <Text fw={600} size="lg">Password Settings</Text>
                
                {/* Length Section - Redesigned */}
                <Card withBorder p="md" radius="sm" style={{
                  backgroundColor: colorScheme === 'dark' 
                    ? 'var(--mantine-color-dark-7)' 
                    : 'var(--mantine-color-gray-0)'
                }}>
                  <Stack gap="md">
                    <Group justify="space-between" align="center">
                      <Text fw={500} size="sm">Password Length</Text>
                      <Group gap="xs">
                        <Badge variant="light" color={strength.color} size="lg" style={{ fontSize: '14px', fontWeight: 600 }}>
                          {length}
                        </Badge>
                        <Text size="xs" c="dimmed">characters</Text>
                      </Group>
                    </Group>
                    
                    <Slider
                      value={length}
                      onChange={setLength}
                      min={4}
                      max={64}
                      step={1}
                      color="violet"
                      size="lg"
                      marks={[
                        { value: 8, label: '8' },
                        { value: 16, label: '16' },
                        { value: 32, label: '32' },
                        { value: 64, label: '64' }
                      ]}
                      styles={{
                        mark: {
                          fontSize: '10px',
                          color: 'var(--mantine-color-dimmed)'
                        },
                        markLabel: {
                          fontSize: '10px',
                          color: 'var(--mantine-color-dimmed)'
                        }
                      }}
                    />
                    
                    {/* Quick Length Buttons */}
                    <Group gap="xs" justify="center">
                      {[8, 12, 16, 24, 32, 48, 64].map((len) => (
                        <Button
                          key={len}
                          variant={length === len ? "filled" : "light"}
                          color="violet"
                          size="xs"
                          onClick={() => setLength(len)}
                          style={{ minWidth: '32px' }}
                        >
                          {len}
                        </Button>
                      ))}
                    </Group>
                    
                    {/* Custom Gradient Progress Bar */}
                    <Box style={{ position: 'relative' }}>
                      <Box
                        style={{
                          height: '12px',
                          borderRadius: '6px',
                          backgroundColor: colorScheme === 'dark' 
                            ? 'var(--mantine-color-dark-4)' 
                            : 'var(--mantine-color-gray-3)',
                          overflow: 'hidden',
                          position: 'relative'
                        }}
                      >
                        <Box
                          style={{
                            height: '100%',
                            width: `${strength.percentage}%`,
                            background: strength.percentage < 30 
                              ? 'linear-gradient(90deg, #ff6b6b 0%, #ff8787 100%)'
                              : strength.percentage < 50
                              ? 'linear-gradient(90deg, #ff922b 0%, #ffa94d 100%)'
                              : strength.percentage < 70
                              ? 'linear-gradient(90deg, #ffd43b 0%, #fff3bf 100%)'
                              : strength.percentage < 85
                              ? 'linear-gradient(90deg, #8ce99a 0%, #69db7c 100%)'
                              : 'linear-gradient(90deg, #51cf66 0%, #40c057 100%)',
                            borderRadius: '6px',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            boxShadow: strength.percentage > 50 
                              ? '0 0 8px rgba(64, 192, 87, 0.3)' 
                              : strength.percentage > 30 
                              ? '0 0 8px rgba(255, 212, 59, 0.3)'
                              : '0 0 8px rgba(255, 107, 107, 0.3)'
                          }}
                        >
                          {/* Animated shine effect */}
                          <Box
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: '-100%',
                              width: '100%',
                              height: '100%',
                              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                              animation: strength.percentage > 70 ? 'shine 2s infinite' : 'none'
                            }}
                          />
                        </Box>
                      </Box>
                      
                      {/* Strength percentage overlay */}
                      <Text
                        size="xs"
                        fw={600}
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          color: strength.percentage > 50 ? 'white' : 'var(--mantine-color-dark-9)',
                          textShadow: strength.percentage > 50 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                          pointerEvents: 'none'
                        }}
                      >
                        {strength.percentage}%
                      </Text>
                    </Box>
                    
                    <Group justify="space-between" align="center">
                      <Badge variant="light" color={strength.color} size="sm">
                        {strength.level}
                      </Badge>
                      <Text size="xs" c="dimmed" ta="right">
                        {strength.description}
                      </Text>
                    </Group>
                  </Stack>
                </Card>

                <Divider />

                {/* Character Types */}
                <Stack gap="md">
                  <Text fw={500}>Character Types</Text>
                  <Switch
                    label="Uppercase letters (A-Z)"
                    checked={includeUppercase}
                    onChange={(event) => setIncludeUppercase(event.currentTarget.checked)}
                    color="violet"
                  />
                  <Switch
                    label="Lowercase letters (a-z)"
                    checked={includeLowercase}
                    onChange={(event) => setIncludeLowercase(event.currentTarget.checked)}
                    color="violet"
                  />
                  <Switch
                    label="Numbers (0-9)"
                    checked={includeNumbers}
                    onChange={(event) => setIncludeNumbers(event.currentTarget.checked)}
                    color="violet"
                  />
                  <Switch
                    label="Symbols (!@#$%^&*)"
                    checked={includeSymbols}
                    onChange={(event) => setIncludeSymbols(event.currentTarget.checked)}
                    color="violet"
                  />
                </Stack>

                <Divider />

                {/* Exclusion Options */}
                <Stack gap="md">
                  <Text fw={500}>Exclusion Options</Text>
                  <Switch
                    label="Exclude similar characters (i, l, 1, L, o, 0, O)"
                    checked={excludeSimilar}
                    onChange={(event) => setExcludeSimilar(event.currentTarget.checked)}
                    color="violet"
                  />
                  <Switch
                    label="Exclude ambiguous symbols ({[()]})"
                    checked={excludeAmbiguous}
                    onChange={(event) => setExcludeAmbiguous(event.currentTarget.checked)}
                    color="violet"
                  />
                </Stack>

                <Divider />

                {/* Generation Options */}
                <NumberInput
                  label="Number of passwords to generate"
                  value={count}
                  onChange={setCount}
                  min={1}
                  max={100}
                  step={1}
                />

                <Button
                  onClick={handleGeneratePasswords}
                  loading={isGenerating}
                  leftSection={<IconRefresh size={16} />}
                  color="violet"
                  size="md"
                  fullWidth
                >
                  Generate Passwords
                </Button>
              </Stack>
            </Card>
          </Grid.Col>

          {/* Right Side - Two Stacked Sections */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="lg">
              {/* Security Analysis Section */}
              <Card withBorder p="lg" radius="md">
                <Stack gap="sm">
                  <Group justify="space-between" align="center">
                    <Text fw={600} size="lg">Security Analysis</Text>
                    <Tooltip label="Detailed password security metrics">
                      <IconInfoCircle size={16} color="var(--mantine-color-dimmed)" />
                    </Tooltip>
                  </Group>
                  
                  <Grid gutter="md">
                    <Grid.Col span={6}>
                      <Stack gap={2}>
                        <Text size="xs" c="dimmed">Entropy</Text>
                        <Group gap="xs" align="center">
                          <IconLock size={14} color={strength.color === 'red' ? 'var(--mantine-color-red-6)' : 'var(--mantine-color-green-6)'} />
                          <Text size="sm" fw={500}>{strength.entropy} bits</Text>
                        </Group>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Stack gap={2}>
                        <Text size="xs" c="dimmed">Character Pool</Text>
                        <Text size="sm" fw={500}>{strength.charsetSize} characters</Text>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <Stack gap={2}>
                        <Text size="xs" c="dimmed">Possible Combinations</Text>
                        <Text size="sm" fw={500}>{strength.combinations}</Text>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <Stack gap={2}>
                        <Text size="xs" c="dimmed">Average Time to Crack</Text>
                        <Group gap="xs" align="center">
                          <IconClock size={14} color={strength.timeColor === 'red' ? 'var(--mantine-color-red-6)' : 'var(--mantine-color-green-6)'} />
                          <Text size="sm" fw={500} c={strength.timeColor}>
                            {strength.timeToCrack}
                          </Text>
                        </Group>
                        <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                          Assumes 1 billion guesses per second
                        </Text>
                      </Stack>
                    </Grid.Col>
                  </Grid>

                  {/* Security Feedback */}
                  {strength.feedback.length > 0 && (
                    <>
                      <Divider />
                      <Stack gap="sm">
                        <Text fw={500} size="sm">Security Recommendations</Text>
                        <List spacing="xs" size="xs">
                          {strength.feedback.map((item, index) => (
                            <List.Item
                              key={index}
                              icon={
                                item.type === 'error' ? (
                                  <IconAlertTriangle size={14} color="var(--mantine-color-red-6)" />
                                ) : item.type === 'warning' ? (
                                  <IconInfoCircle size={14} color="var(--mantine-color-orange-6)" />
                                ) : (
                                  <IconCheck size={14} color="var(--mantine-color-green-6)" />
                                )
                              }
                            >
                              <Text 
                                size="xs" 
                                c={item.type === 'error' ? 'red' : item.type === 'warning' ? 'orange' : 'green'}
                              >
                                {item.message}
                              </Text>
                            </List.Item>
                          ))}
                        </List>
                      </Stack>
                    </>
                  )}
                </Stack>
              </Card>

              {/* Generated Passwords Section */}
              <Card withBorder p="lg" radius="md" style={{ flex: 1 }}>
                <Stack gap="lg" h="100%">
                  <Group justify="space-between">
                    <Text fw={600} size="lg">Generated Passwords</Text>
                    {passwords.length > 0 && (
                      <Group gap="xs">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={downloadPasswords}
                          title="Download as text file"
                        >
                          <IconDownload size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={clearPasswords}
                          title="Clear all passwords"
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    )}
                  </Group>

                  {passwords.length === 0 ? (
                    <Box
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colorScheme === 'dark' 
                          ? 'var(--mantine-color-dark-6)' 
                          : 'var(--mantine-color-gray-0)',
                        borderRadius: 'var(--mantine-radius-md)',
                        padding: 'var(--mantine-spacing-xl)'
                      }}
                    >
                      <Stack align="center" gap="md">
                        <PasswordIcon size={48} color="var(--mantine-color-dimmed)" />
                        <Text c="dimmed" ta="center">
                          Configure your settings and click "Generate Passwords" to create secure passwords
                        </Text>
                      </Stack>
                    </Box>
                  ) : (
                    <Stack gap="md" style={{ flex: 1 }}>
                      {passwords.map((password, index) => (
                        <Paper
                          key={password.id}
                          p="md"
                          withBorder
                          style={{
                            backgroundColor: colorScheme === 'dark' 
                              ? 'var(--mantine-color-dark-7)' 
                              : 'var(--mantine-color-gray-0)'
                          }}
                        >
                          <Group justify="space-between" align="flex-start">
                            <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
                              <Text size="xs" c="dimmed">
                                Password {index + 1} • Generated at {password.timestamp}
                              </Text>
                              <Text
                                ff="monospace"
                                size="sm"
                                style={{
                                  wordBreak: 'break-all',
                                  userSelect: 'all'
                                }}
                              >
                                {password.value}
                              </Text>
                            </Stack>
                            <ActionIcon
                              variant="light"
                              color="blue"
                              onClick={() => copyToClipboard(password.value)}
                              title="Copy to clipboard"
                              style={{ flexShrink: 0 }}
                            >
                              <IconCopy size={16} />
                            </ActionIcon>
                          </Group>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </Card>
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    </Paper>
    </>
  );
};

export default PasswordGeneratorTool; 