import { useLocale } from '../../../common/i18n';

export function AppIntent() {

  const { t } = useLocale();

  return (
    <svg class="svgicon" viewBox="0 0 24 24">
      <title>{t('android_intent_button_title') || 'Open in app'}</title>
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      />
      <text
        x="12"
        y="15"
        text-anchor="middle"
        font-size="12"
        font-family="system-ui, -apple-system, Segoe UI, Roboto, Noto Sans JP, Helvetica, Arial, sans-serif"
        fill="currentColor"
      >
        あ
      </text>
    </svg>
  );
}



