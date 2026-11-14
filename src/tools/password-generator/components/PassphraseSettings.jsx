import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MAX_WORDS, MIN_WORDS, SEPARATORS } from '../lib/passphrase.js';

const WORD_COUNTS = Array.from({ length: MAX_WORDS - MIN_WORDS + 1 }, (_, index) => MIN_WORDS + index);

export default function PassphraseSettings({
  wordCount,
  onWordCountChange,
  separator,
  onSeparatorChange,
  capitalise,
  onCapitaliseChange,
  appendDigit,
  onAppendDigitChange,
  meter,
}) {
  const current = wordCount[0];

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <Label className="text-body-md font-medium">Number of Words</Label>
          <div className="flex items-center gap-2">
            <span className="text-data-md font-mono text-on-surface">{current}</span>
            <span className="text-body-sm text-muted-foreground">words</span>
          </div>
        </div>

        <div className="space-y-4">
          <Slider
            value={wordCount}
            onValueChange={onWordCountChange}
            min={MIN_WORDS}
            max={MAX_WORDS}
            step={1}
            className="w-full"
            aria-label="Number of words"
          />

          <div className="flex flex-wrap gap-2">
            {WORD_COUNTS.map((words) => (
              <Button
                key={words}
                variant={current === words ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => onWordCountChange([words])}
                aria-pressed={current === words}
                className={`w-10 font-mono ${current === words ? 'border-outline-strong text-on-surface' : ''}`}
              >
                {words}
              </Button>
            ))}
          </div>

          {meter}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <Label htmlFor="separator" className="text-body-md font-medium">
          Separator
        </Label>
        <Select value={separator} onValueChange={onSeparatorChange}>
          <SelectTrigger id="separator">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEPARATORS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="space-y-4">
        <Label className="text-body-md font-medium">Extras</Label>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch id="capitalise" checked={capitalise} onCheckedChange={onCapitaliseChange} />
            <Label htmlFor="capitalise">Capitalise each word</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="append-digit" checked={appendDigit} onCheckedChange={onAppendDigitChange} />
            <Label htmlFor="append-digit">Append a digit (0-9)</Label>
          </div>
        </div>
        <p className="text-body-sm text-muted-foreground">
          Words come from the EFF large wordlist. Capitals and the separator make a passphrase easier to accept, not
          harder to guess; only the digit adds strength.
        </p>
      </div>
    </>
  );
}
