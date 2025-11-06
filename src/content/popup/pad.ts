import { h, render } from 'preact';

import { html } from '../../utils/builder';

import { Pad } from './Tabs/Pad';

export function renderPad(): HTMLElement {
  const containerElement = html('div', { class: 'entry-data' });

  render(h(Pad, {}), containerElement);

  return containerElement;
}
