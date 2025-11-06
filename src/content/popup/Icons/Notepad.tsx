import { useLocale } from '../../../common/i18n';

export function Notepad() {
  const { t } = useLocale();

  return (
    <svg class="svgicon" viewBox="0 0 24 24">
      <title>{t('pad_tab_title')}</title>
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M14 2v6h6M8 13h8M8 17h8M8 9h2"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}
