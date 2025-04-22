import type { KanjiResult } from '@birchill/jpdict-idb';
import { useRef } from 'preact/hooks';
import browser from 'webextension-polyfill';

import { useLocale } from '../../../common/i18n';
import type { ReferenceAbbreviation } from '../../../common/refs';
import { classes } from '../../../utils/classes';

import { AddToPad } from '../Icons/AddToPad';
import { Share } from '../Icons/Share';

import { usePopupOptions } from './../options-context';
import { containerHasSelectedText } from './../selection';
import type { StartCopyCallback } from './../show-popup';
import { KanjiInfo } from './KanjiInfo';
import { KanjiReferencesTable } from './KanjiReferencesTable';
import { KanjiStrokeAnimation } from './KanjiStrokeAnimation';

export type Props = {
  entry: KanjiResult;
  index: number;
  kanjiReferences: Array<ReferenceAbbreviation>;
  onStartCopy?: StartCopyCallback;
  selectState: 'unselected' | 'selected' | 'flash';
  showComponents?: boolean;
};

export function KanjiEntry(props: Props) {
  const kanjiTable = useRef<HTMLDivElement>(null);

  return (
    <div
      class={classes(
        'tp:flex tp:flex-col tp:gap-3.5 tp:px-5 tp:py-3',
        // Set the -selected / -flash class since we use that we scroll into
        // view any selected item during / after copying.
        //
        // Once everything is converted to Preact we hopefully won't need this
        // anymore (since we'll do minimal DOM updates) but if we do, then we
        // should prefer using a data attribute to a CSS class.
        props.selectState === 'selected' && '-selected',
        props.selectState === 'flash' && '-flash'
      )}
      ref={kanjiTable}
    >
      <div class="tp:flex tp:items-start tp:gap-[20px]">
        <KanjiCharacter
          c={props.entry.c}
          onClick={(trigger) => {
            if (containerHasSelectedText(kanjiTable.current!)) {
              return;
            }

            props.onStartCopy?.(props.index, trigger);
          }}
          selectState={props.selectState}
          st={props.entry.st}
        />
        <div class="tp:mt-1.5 tp:grow">
          <KanjiInfo {...props.entry} showComponents={props.showComponents} />
        </div>
      </div>
      {!!props.kanjiReferences.length && (
        <div>
          <KanjiReferencesTable
            entry={props.entry}
            kanjiReferences={props.kanjiReferences}
          />
        </div>
      )}
    </div>
  );
}

type KanjiCharacterProps = {
  c: string;
  onClick?: (trigger: 'touch' | 'mouse') => void;
  selectState: 'unselected' | 'selected' | 'flash';
  st?: string;
};

// Handle share button click
const handleShare = (text: string) => (e: MouseEvent) => {
  e.stopPropagation(); // Prevent triggering copy mode

  // Use Web Share API if available (e.g. on Android)
  if (navigator.share) {
    navigator.share({ text }).catch(() => {
      // Fallback to clipboard if sharing fails
      navigator.clipboard.writeText(text);
    });
  } else {
    // Fallback to clipboard on desktop
    navigator.clipboard.writeText(text);
  }
};

// Handle add to pad button click
const handleAddToPad = (text: string) => (e: MouseEvent) => {
  e.stopPropagation(); // Prevent triggering copy mode

  // Add success animation
  const button = e.currentTarget as HTMLElement;
  button.classList.add('add-to-pad-success');
  setTimeout(() => {
    button.classList.remove('add-to-pad-success');
  }, 400); // Match the duration in CSS

  const PAD_STORAGE_KEY = '10ten-ja-reader-pad';
  browser.storage.local.get(PAD_STORAGE_KEY).then((result) => {
    const currentContent = (result[PAD_STORAGE_KEY] as string) || '';
    const newContent = currentContent ? `${currentContent}\n${text}` : text;
    browser.storage.local.set({ [PAD_STORAGE_KEY]: newContent });
  });
};

function KanjiCharacter(props: KanjiCharacterProps) {
  const { interactive } = usePopupOptions();
  const { t } = useLocale();

  // There's no way to trigger the animation when we're not in "mouse
  // interactive" mode so just show the static character in that case.
  return (
    <div class="tp:flex tp:flex-col tp:items-center">
      {props.st && interactive ? (
        <KanjiStrokeAnimation
          onClick={props.onClick}
          selectState={props.selectState}
          st={props.st}
        />
      ) : (
        <StaticKanjiCharacter
          c={props.c}
          onClick={props.onClick}
          selectState={props.selectState}
        />
      )}
      <div class="tp:flex tp:space-x-1 tp:mt-2">
        <button
          class="share-button"
          onClick={handleShare(props.c)}
          title={t('share_button_title', props.c) || 'Share'}
        >
          <Share />
        </button>
        <button
          class="share-button"
          onClick={handleAddToPad(props.c)}
          title={t('add_to_pad_button_title')}
        >
          <AddToPad />
        </button>
      </div>
    </div>
  );
}

function StaticKanjiCharacter(props: KanjiCharacterProps) {
  const lastPointerType = useRef<string>('touch');
  const { interactive } = usePopupOptions();

  return (
    <div
      class={classes(
        'tp:text-(--primary-highlight) tp:text-big-kanji tp:text-center tp:pt-2 tp:rounded-md',
        '[text-shadow:var(--shadow-color)_1px_1px_4px]',
        ...(interactive
          ? [
              'tp:hover:text-(--selected-highlight)',
              'tp:hover:bg-(--hover-bg)',
              'tp:hover:cursor-pointer',
              // Fade _out_ the color change
              'tp:transition-colors tp:interactive:duration-100',
              'tp:ease-out',
              'tp:hover:transition-none',
            ]
          : []),
        // Ensure any selection colors are applied before fading in the
        // overlay
        props.selectState === 'selected' &&
          'tp:no-overlay:text-(--selected-highlight) tp:no-overlay:bg-(--selected-bg)',
        // Run the flash animation, but not until the overlay has
        // disappeared.
        props.selectState === 'flash' && 'tp:no-overlay:animate-flash'
      )}
      lang="ja"
      onPointerUp={(evt) => {
        lastPointerType.current = evt.pointerType;
      }}
      onClick={() => {
        const trigger = lastPointerType.current === 'mouse' ? 'mouse' : 'touch';
        props.onClick?.(trigger);
      }}
    >
      {props.c}
    </div>
  );
}
