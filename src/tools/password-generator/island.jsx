import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  Copy,
  Download,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Check,
  Info,
  Clock,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { copyText, downloadFile } from '@/core';
import { createToolIcon } from '@/components/ui/tool-icon';
import { DEFAULT_PASSWORD_OPTIONS, generatePassword, passwordStrength } from './lib/password.js';
import {
  DEFAULT_PASSPHRASE_OPTIONS,
  generatePassphrase,
  loadWordlist,
  passphraseStrength,
} from './lib/passphrase.js';
import PassphraseSettings from './components/PassphraseSettings.jsx';
import GeneratedValue from './components/GeneratedValue.jsx';

const PasswordIcon = createToolIcon('key-round');

const PasswordGeneratorTool = () => {
  const [mode, setMode] = useState('password');

  const [length, setLength] = useState([DEFAULT_PASSWORD_OPTIONS.length]);
  const [count, setCount] = useState(1);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);

  const [wordCount, setWordCount] = useState([DEFAULT_PASSPHRASE_OPTIONS.words]);
  const [separator, setSeparator] = useState(DEFAULT_PASSPHRASE_OPTIONS.separator);
  const [capitalise, setCapitalise] = useState(DEFAULT_PASSPHRASE_OPTIONS.capitalise);
  const [appendDigit, setAppendDigit] = useState(DEFAULT_PASSPHRASE_OPTIONS.digit);

  const [passwords, setPasswords] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const isPassphrase = mode === 'passphrase';
  const noun = isPassphrase ? 'passphrase' : 'password';
  const Noun = isPassphrase ? 'Passphrase' : 'Password';
  const currentLength = length[0];
  const currentWords = wordCount[0];

  const passwordOptions = {
    length: currentLength,
    includeUppercase,
    includeLowercase,
    includeNumbers,
    includeSymbols,
    excludeSimilar,
    excludeAmbiguous,
  };
  const passphraseOptions = { words: currentWords, separator, capitalise, digit: appendDigit };

  const handleGeneratePasswords = async ({ silent = false, as = mode } = {}) => {
    const phrase = as === 'passphrase';
    try {
      setIsGenerating(true);

      if (!phrase && !includeUppercase && !includeLowercase && !includeNumbers && !includeSymbols) {
        toast.error('Please select at least one character type');
        return;
      }

      const wordlist = phrase ? await loadWordlist() : null;

      const newPasswords = [];
      for (let i = 0; i < count; i++) {
        const result = phrase
          ? generatePassphrase(wordlist, passphraseOptions)
          : { value: generatePassword(passwordOptions) };
        newPasswords.push({
          id: Date.now() + i,
          ...result,
          kind: phrase ? 'passphrase' : 'password',
          timestamp: new Date().toLocaleTimeString()
        });
      }

      setPasswords(newPasswords);
      if (!silent) {
        toast.success(`Successfully generated ${count} ${phrase ? 'passphrase' : 'password'}${count > 1 ? 's' : ''}`);
      }
    } catch (error) {
      toast.error(phrase && !/character type/.test(error.message) ? `Could not generate a passphrase: ${error.message}` : error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    handleGeneratePasswords({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleModeChange = (next) => {
    if (next === mode) return;
    setMode(next);
    handleGeneratePasswords({ silent: true, as: next });
  };

  // Copy password to clipboard
  const copyToClipboard = async (password) => {
    if (await copyText(password)) {
      toast.success(`${Noun} copied to clipboard`);
    } else {
      toast.error(`Failed to copy ${noun} to clipboard`);
    }
  };

  // Download passwords as text file
  const downloadPasswords = () => {
    if (passwords.length === 0) {
      toast.error(`Generate some ${noun}s first`);
      return;
    }

    const phrases = passwords[0].kind === 'passphrase';
    const item = phrases ? 'passphrase' : 'password';
    const size = phrases
      ? `Words: ${passwords[0].parts.length} each`
      : `Length: ${passwords[0].value.length} characters each`;

    const header = `RUSS TOOLS - Password Generator
================================

Generated from: russ.tools
Date: ${new Date().toLocaleString()}
Count: ${passwords.length} ${item}${passwords.length > 1 ? 's' : ''}
${size}

SECURITY NOTICE:
- Store these ${item}s securely
- Never share ${item}s via email or unsecured channels
- Use a different ${item} for each account
- Consider using a password manager

Generated ${phrases ? 'Passphrases' : 'Passwords'}:

`;

    const passwordList = passwords.map((pwd) => pwd.value).join('\n');

    const footer = `

End of ${item} list
Generated with love by RussTools
Visit: https://russ.tools
`;

    const content = header + passwordList + footer;

    downloadFile(content, `${item}s_${new Date().toISOString().split('T')[0]}.txt`, 'text/plain');

    toast.success(`${phrases ? 'Passphrases' : 'Passwords'} saved to file!`);
  };

  // Clear all passwords
  const clearPasswords = () => {
    setPasswords([]);
    toast.success(`All ${noun}s cleared`);
  };

  const strength = isPassphrase ? passphraseStrength(passphraseOptions) : passwordStrength(passwordOptions);

  const strengthMeter = (
    <div className="space-y-2">
      <Progress value={strength.percentage} className="h-1.5" />

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <span className={`text-body-sm font-medium ${strength.tone}`}>
          {strength.level}
        </span>
        <span className="text-body-sm text-muted-foreground">
          {strength.description}
        </span>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <Tabs value={mode} onValueChange={handleModeChange} className="space-y-6">
        <TabsList aria-label="What to generate">
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="passphrase">Passphrase</TabsTrigger>
        </TabsList>
        <TabsContent value={mode} className="mt-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <Card>
            <CardHeader>
              <h3 className="text-title-sm">{Noun} Settings</h3>
            </CardHeader>
            <CardContent className="space-y-6">
              {isPassphrase ? (
                <PassphraseSettings
                  wordCount={wordCount}
                  onWordCountChange={setWordCount}
                  separator={separator}
                  onSeparatorChange={setSeparator}
                  capitalise={capitalise}
                  onCapitaliseChange={setCapitalise}
                  appendDigit={appendDigit}
                  onAppendDigitChange={setAppendDigit}
                  meter={strengthMeter}
                />
              ) : (
              <>
              {/* Length Section */}
              <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                    <Label className="text-body-md font-medium">Password Length</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-data-md font-mono text-on-surface">{currentLength}</span>
                      <span className="text-body-sm text-muted-foreground">characters</span>
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
                          variant={currentLength === len ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => setLength([len])}
                          aria-pressed={currentLength === len}
                          className={`w-12 font-mono ${
                            currentLength === len ? 'border-outline-strong text-on-surface' : ''
                          }`}
                        >
                          {len}
                        </Button>
                      ))}
                    </div>
                    
                    {strengthMeter}
                  </div>
              </div>

              <Separator />

              {/* Character Types */}
              <div className="space-y-4">
                <Label className="text-body-md font-medium">Character Types</Label>
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
                <Label className="text-body-md font-medium">Exclusion Options</Label>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="similar"
                      checked={excludeSimilar}
                      onCheckedChange={setExcludeSimilar}
                    />
                    <Label htmlFor="similar" className="text-body-sm">
                      Exclude similar characters (i, l, 1, L, o, 0, O)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ambiguous"
                      checked={excludeAmbiguous}
                      onCheckedChange={setExcludeAmbiguous}
                    />
                    <Label htmlFor="ambiguous" className="text-body-sm">
                      Exclude ambiguous symbols ({`{[()]}`})
                    </Label>
                  </div>
                </div>
              </div>

              </>
              )}

              <Separator />

              {/* Generation Options */}
              <div className="space-y-4">
                <Label htmlFor="count" className="text-body-md font-medium">
                  Number of {noun}s to generate
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
                onClick={() => handleGeneratePasswords()}
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin-ccw" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Generate {Noun}s
              </Button>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6 max-lg:contents">
            {/* Generated Passwords Section */}
            <Card className="max-lg:order-first">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <h3 className="text-title-sm">Generated {Noun}s</h3>
                  {passwords.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadPasswords}
                        aria-label={`Download ${noun}s`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearPasswords}
                        aria-label={`Clear ${noun}s`}
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
                    <PasswordIcon className="size-10 text-on-surface-faint mb-4" />
                    <p className="text-muted-foreground">
                      Configure your settings and click "Generate {Noun}s" to create secure {noun}s
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {passwords.map((password, index) => (
                      <Card key={password.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-center gap-2">
                            <div className="flex-1 min-w-0 space-y-1">
                              <p className="text-body-sm text-muted-foreground">
                                {password.kind === 'passphrase' ? 'Passphrase' : 'Password'} {index + 1} • Generated at {password.timestamp}
                              </p>
                              <GeneratedValue entry={password} />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(password.value)}
                              className="ml-2 flex-shrink-0"
                              aria-label={`Copy ${password.kind === 'passphrase' ? 'passphrase' : 'password'}`}
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
            {/* Security Analysis Section */}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <h3 className="text-title-sm">Security Analysis</h3>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Detailed {noun} security metrics</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-body-sm text-muted-foreground">Entropy</p>
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-on-surface-faint" />
                      <span className="text-data-md font-mono">{strength.entropy} bits</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-body-sm text-muted-foreground">{strength.poolLabel}</p>
                    <span className="text-data-md font-mono">{strength.pool}</span>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <p className="text-body-sm text-muted-foreground">Possible Combinations</p>
                    <span className="text-data-md font-mono">{strength.combinations}</span>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <p className="text-body-sm text-muted-foreground">Average Time to Crack</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-on-surface-faint" />
                      <span className="text-data-md font-mono">{strength.timeToCrack}</span>
                    </div>
                    <p className="text-body-sm text-muted-foreground italic">
                      At 1 billion guesses per second
                    </p>
                  </div>
                </div>

                {/* Security Feedback */}
                {strength.feedback.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-body-sm font-medium">Issues</h4>
                      <div className="space-y-2">
                        {strength.feedback.map((item, index) => (
                          <div key={index} className="flex items-start gap-2">
                            {item.type === 'error' ? (
                              <AlertTriangle className="h-4 w-4 text-danger mt-0.5 flex-shrink-0" />
                            ) : item.type === 'warning' ? (
                              <Info className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                            ) : (
                              <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                            )}
                            <span className={`text-body-sm ${
                              item.type === 'error' ? 'text-danger' : 
                              item.type === 'warning' ? 'text-warning' : 
                              'text-success'
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

          </div>
        </div>
        </TabsContent>
      </Tabs>
    </TooltipProvider>
  );
};

export default PasswordGeneratorTool;
