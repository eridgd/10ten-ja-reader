import { useEffect, useState } from 'preact/hooks';
import browser from 'webextension-polyfill';

import { useLocale } from '../../../common/i18n';

import { Share } from '../Icons/Share';

import './Pad.css';

export function Pad() {
  const { t } = useLocale();
  const [padContent, setPadContent] = useState('');
  const PAD_STORAGE_KEY = '10ten-ja-reader-pad';

  useEffect(() => {
    // Load pad content from storage
    browser.storage.local.get(PAD_STORAGE_KEY).then((result) => {
      const storedContent = (result[PAD_STORAGE_KEY] as string) || '';
      setPadContent(storedContent);
    });
  }, []);

  const handleShare = () => {
    if (padContent) {
      if (navigator.share) {
        navigator.share({ text: padContent }).catch(() => {
          navigator.clipboard.writeText(padContent);
        });
      } else {
        navigator.clipboard.writeText(padContent);
      }
    }
  };

  const handleClear = () => {
    if (confirm(t('clear_pad_confirm'))) {
      setPadContent('');
      browser.storage.local.set({ [PAD_STORAGE_KEY]: '' });
    }
  };

  const handleTextChange = (e: Event) => {
    const newContent = (e.target as HTMLTextAreaElement).value;
    setPadContent(newContent);
    // Save to storage
    browser.storage.local.set({ [PAD_STORAGE_KEY]: newContent });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Prevent tab switching when Enter is pressed
    if (e.key === 'Enter') {
      e.stopPropagation();
    }
  };

  return (
    <div class="pad-tab">
      <div class="pad-controls">
        <button
          class="share-button"
          onClick={handleShare}
          disabled={!padContent}
          title={t('share_button_title')}
        >
          <Share />
        </button>
        <button
          class="clear-button"
          onClick={handleClear}
          disabled={!padContent}
          title={t('clear_pad_button_title')}
        >
          {t('clear_pad_button')}
        </button>
      </div>
      <textarea
        class="pad-textarea"
        value={padContent}
        onInput={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={t('pad_placeholder')}
      />
    </div>
  );
}
