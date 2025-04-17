import { useLocale } from '../../../common/i18n';

export function AddToPad() {
  const { t } = useLocale();

  return (
    <svg class="svgicon" viewBox="0 0 24 24" style="opacity: 0.5">
      <title>{t('add_to_pad_button_title')}</title>
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}
