import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  Copy,
  Download,
  RefreshCw,
  Trash2,
  Shield,
  AlertTriangle,
  Check,
  Info,
  Clock,
  Lock,
  Key
} from 'lucide-react';
import { toast } from 'sonner';
import PasswordIcon from './PasswordIcon';
import SEOHead from '../../common/SEOHead';
import ToolHeader from '../../common/ToolHeader';
import { generateToolSEO } from '../../../utils/seoUtils';
import toolsConfig from '../../../utils/toolsConfig.json';

const PasswordGeneratorShadcn = () => {
  // Get tool configuration for SEO
  const toolConfig = toolsConfig.find(tool => tool.id === 'password-generator');
  const seoData = generateToolSEO(toolConfig);
  
  // Password generation settings
  const [length, setLength] = useState([24]);
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

  const currentLength = length[0];

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
    const entropy = Math.log2(Math.pow(charsetSize, currentLength));
    
    const possibleCombinations = Math.pow(charsetSize, currentLength);
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
      
      // For extremely large numbers, use scientific notation
      const exponent = Math.floor(Math.log10(num));
      const mantissa = num / Math.pow(10, exponent);
      return `${mantissa.toFixed(1)} × 10^${exponent}`;
    };

    // Convert to human readable time
    let timeString = '';
    let timeColor = 'destructive';
    
    if (secondsToCrack < 1) {
      timeString = 'Instantly';
      timeColor = 'destructive';
    } else if (secondsToCrack < 60) {
      timeString = `${Math.round(secondsToCrack)} second${secondsToCrack > 1 ? 's' : ''}`;
      timeColor = 'destructive';
    } else if (secondsToCrack < 3600) {
      const minutes = Math.round(secondsToCrack / 60);
      timeString = `${minutes} minute${minutes > 1 ? 's' : ''}`;
      timeColor = 'destructive';
    } else if (secondsToCrack < 86400) {
      const hours = Math.round(secondsToCrack / 3600);
      timeString = `${hours} hour${hours > 1 ? 's' : ''}`;
      timeColor = 'destructive';
    } else if (secondsToCrack < 2592000) { // 30 days
      const days = Math.round(secondsToCrack / 86400);
      timeString = `${days} day${days > 1 ? 's' : ''}`;
      timeColor = 'secondary';
    } else if (secondsToCrack < 31536000) { // 1 year
      const months = Math.round(secondsToCrack / 2592000);
      timeString = `${months} month${months > 1 ? 's' : ''}`;
      timeColor = 'secondary';
    } else if (secondsToCrack < 31536000000) { // 1000 years
      const years = Math.round(secondsToCrack / 31536000);
      if (years < 1000) {
        timeString = `${years.toLocaleString()} year${years > 1 ? 's' : ''}`;
      } else {
        timeString = `${(years / 1000).toFixed(1)}K years`;
      }
      timeColor = 'default';
    } else {
      const bYears = (secondsToCrack / 31536000000000000);
      if (bYears < 1000) {
        timeString = `${bYears.toFixed(1)}B years`;
      } else {
        timeString = `${(bYears / 1000).toFixed(1)}T years`;
      }
      timeColor = 'default';
    }

    // Determine overall strength level
    let level, color, percentage, description;
    
    if (entropy < 25) {
      level = 'Very Weak';
      color = 'destructive';
      percentage = 10;
      description = 'Extremely vulnerable to attacks';
    } else if (entropy < 35) {
      level = 'Weak';
      color = 'destructive';
      percentage = 25;
      description = 'Easily cracked by modern computers';
    } else if (entropy < 50) {
      level = 'Fair';
      color = 'secondary';
      percentage = 45;
      description = 'Vulnerable to dedicated attacks';
    } else if (entropy < 65) {
      level = 'Good';
      color = 'secondary';
      percentage = 65;
      description = 'Reasonably secure for most uses';
    } else if (entropy < 80) {
      level = 'Strong';
      color = 'default';
      percentage = 80;
      description = 'Very secure against most attacks';
    } else {
      level = 'Excellent';
      color = 'default';
      percentage = 100;
      description = 'Extremely secure, enterprise-grade';
    }

    // Generate detailed feedback
    const feedback = [];
    
    if (currentLength < 8) {
      feedback.push({ type: 'error', message: 'Password is too short (minimum 8 characters recommended)' });
    } else if (currentLength < 12) {
      feedback.push({ type: 'warning', message: 'Consider using 12+ characters for better security' });
    } else if (currentLength >= 16) {
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
  }, [currentLength, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar, excludeAmbiguous]);

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
    for (let i = 0; i < Math.min(requiredChars.length, currentLength); i++) {
      password += requiredChars[i];
    }

    // Fill the rest with random characters
    for (let i = password.length; i < currentLength; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password to avoid predictable patterns
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }, [currentLength, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar, excludeAmbiguous]);

  // Generate multiple passwords
  const handleGeneratePasswords = async () => {
    try {
      setIsGenerating(true);
      
      if (!includeUppercase && !includeLowercase && !includeNumbers && !includeSymbols) {
        toast.error('Please select at least one character type');
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
      toast.success(`Successfully generated ${count} password${count > 1 ? 's' : ''}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy password to clipboard
  const copyToClipboard = async (password) => {
    try {
      await navigator.clipboard.writeText(password);
      toast.success('Password copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy password to clipboard');
    }
  };

  // Download passwords as text file
  const downloadPasswords = () => {
    if (passwords.length === 0) {
      toast.error('Generate some passwords first');
      return;
    }

    const header = `RUSS TOOLS - Password Generator
================================

Generated from: russ.tools
Date: ${new Date().toLocaleString()}
Count: ${passwords.length} password${passwords.length > 1 ? 's' : ''}
Length: ${currentLength} characters each

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

    toast.success('Passwords saved to file!');
  };

  // Clear all passwords
  const clearPasswords = () => {
    setPasswords([]);
    toast.success('All passwords cleared');
  };

  const strength = calculateStrength();

  return (
    <TooltipProvider>
      <SEOHead {...seoData} />
      <div className="space-y-6">
        {/* Header */}
        <ToolHeader
          icon={PasswordIcon}
          title="Password Generator"
          description="Generate secure, random passwords with customizable options"
          iconColor="violet"
          showTitle={false}
          standalone={true}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold">Password Settings</h3>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Length Section */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-medium">Password Length</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant={strength.color} className="text-sm px-3">
                        {currentLength}
                      </Badge>
                      <span className="text-xs text-muted-foreground">characters</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Slider
                      value={length}
                      onValueChange={setLength}
                      min={4}
                      max={64}
                      step={1}
                      className="w-full"
                    />
                    
                    {/* Quick Length Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {[8, 12, 16, 24, 32, 48, 64].map((len) => (
                        <Button
                          key={len}
                          variant={currentLength === len ? "default" : "outline"}
                          size="sm"
                          onClick={() => setLength([len])}
                          className="w-12"
                        >
                          {len}
                        </Button>
                      ))}
                    </div>
                    
                    {/* Custom Progress Bar */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Progress value={strength.percentage} className="h-3" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-medium text-white drop-shadow">
                            {strength.percentage}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Badge variant={strength.color} className="text-xs">
                          {strength.level}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {strength.description}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Character Types */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Character Types</Label>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="uppercase"
                      checked={includeUppercase}
                      onCheckedChange={setIncludeUppercase}
                    />
                    <Label htmlFor="uppercase">Uppercase letters (A-Z)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="lowercase"
                      checked={includeLowercase}
                      onCheckedChange={setIncludeLowercase}
                    />
                    <Label htmlFor="lowercase">Lowercase letters (a-z)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="numbers"
                      checked={includeNumbers}
                      onCheckedChange={setIncludeNumbers}
                    />
                    <Label htmlFor="numbers">Numbers (0-9)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="symbols"
                      checked={includeSymbols}
                      onCheckedChange={setIncludeSymbols}
                    />
                    <Label htmlFor="symbols">Symbols (!@#$%^&*)</Label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Exclusion Options */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Exclusion Options</Label>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="similar"
                      checked={excludeSimilar}
                      onCheckedChange={setExcludeSimilar}
                    />
                    <Label htmlFor="similar" className="text-sm">
                      Exclude similar characters (i, l, 1, L, o, 0, O)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ambiguous"
                      checked={excludeAmbiguous}
                      onCheckedChange={setExcludeAmbiguous}
                    />
                    <Label htmlFor="ambiguous" className="text-sm">
                      Exclude ambiguous symbols ({`{[()]}`})
                    </Label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Generation Options */}
              <div className="space-y-4">
                <Label htmlFor="count" className="text-base font-medium">
                  Number of passwords to generate
                </Label>
                <Input
                  id="count"
                  type="number"
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  min={1}
                  max={100}
                  className="w-full"
                />
              </div>

              <Button
                onClick={handleGeneratePasswords}
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Generate Passwords
              </Button>
            </CardContent>
          </Card>

          {/* Right Side - Two Stacked Sections */}
          <div className="space-y-6">
            {/* Security Analysis Section */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">Security Analysis</h3>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Detailed password security metrics</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Entropy</p>
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">{strength.entropy} bits</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Character Pool</p>
                    <span className="text-sm font-medium">{strength.charsetSize} characters</span>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <p className="text-xs text-muted-foreground">Possible Combinations</p>
                    <span className="text-sm font-medium">{strength.combinations}</span>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <p className="text-xs text-muted-foreground">Average Time to Crack</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-600" />
                      <Badge variant={strength.timeColor} className="text-sm">
                        {strength.timeToCrack}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground italic">
                      Assumes 1 billion guesses per second
                    </p>
                  </div>
                </div>

                {/* Security Feedback */}
                {strength.feedback.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Security Recommendations</h4>
                      <div className="space-y-2">
                        {strength.feedback.map((item, index) => (
                          <div key={index} className="flex items-start gap-2">
                            {item.type === 'error' ? (
                              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            ) : item.type === 'warning' ? (
                              <Info className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            ) : (
                              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            )}
                            <span className={`text-xs ${
                              item.type === 'error' ? 'text-red-600' : 
                              item.type === 'warning' ? 'text-orange-600' : 
                              'text-green-600'
                            }`}>
                              {item.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Generated Passwords Section */}
            <Card className="flex-1">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">Generated Passwords</h3>
                  {passwords.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadPasswords}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearPasswords}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {passwords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Key className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Configure your settings and click "Generate Passwords" to create secure passwords
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {passwords.map((password, index) => (
                      <Card key={password.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0 space-y-2">
                              <p className="text-xs text-muted-foreground">
                                Password {index + 1} • Generated at {password.timestamp}
                              </p>
                              <p className="font-mono text-sm break-all select-all">
                                {password.value}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(password.value)}
                              className="ml-2 flex-shrink-0"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default PasswordGeneratorShadcn;