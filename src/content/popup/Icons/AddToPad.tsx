import { useLocale } from '../../../common/i18n';

export function AddToPad() {
  const { t } = useLocale();

  return (
    <svg class="svgicon" viewBox="0 0 24 24">
      <title>{t('add_to_pad_button_title')}</title>
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      />
      <line
        x1="12"
        y1="8"
        x2="12"
        y2="16"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      />
      <line
        x1="8"
        y1="12"
        x2="16"
        y2="12"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>
  );
}
