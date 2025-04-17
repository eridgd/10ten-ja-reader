import { useCallback, useEffect, useState } from 'preact/hooks';
import browser from 'webextension-polyfill';

import { useLocale } from '../../../common/i18n';

import { Share } from '../Icons/Share';

import './Pad.css';

const PAD_STORAGE_KEY = '10ten-ja-reader-pad';

export function Pad() {
  const { t } = useLocale();
  const [padContent, setPadContent] = useState('');

  // Load pad content from storage on mount
  useEffect(() => {
    const loadPadContent = async () => {
      const result = await browser.storage.local.get(PAD_STORAGE_KEY);
      setPadContent((result[PAD_STORAGE_KEY] as string) || '');
    };
    loadPadContent();
  }, []);

  // Save pad content to storage whenever it changes
  useEffect(() => {
    if (padContent !== undefined) {
      browser.storage.local.set({ [PAD_STORAGE_KEY]: padContent });
    }
  }, [padContent]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({ text: padContent }).catch(() => {
        navigator.clipboard.writeText(padContent);
      });
    } else {
      navigator.clipboard.writeText(padContent);
    }
  }, [padContent]);

  const handleClear = useCallback(() => {
    if (confirm(t('clear_pad_confirm'))) {
      setPadContent('');
    }
  }, [t]);

  return (
    <div class="pad-tab">
      <div class="pad-controls">
        <button
          class="share-button"
          onClick={handleShare}
          title={t('share_button_title')}
        >
          <Share />
        </button>
        <button
          class="clear-button"
          onClick={handleClear}
          title={t('clear_pad_button_title')}
        >
          {t('clear_pad_button')}
        </button>
      </div>
      <textarea
        class="pad-textarea"
        value={padContent}
        onInput={(e) => setPadContent(e.currentTarget.value)}
        placeholder={t('pad_placeholder')}
      />
    </div>
  );
}
