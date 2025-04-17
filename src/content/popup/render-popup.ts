/// <reference path="../../common/css.d.ts" />
import { h, render } from 'preact';

import type { FontFace, FontSize } from '../../common/content-config-params';
import { html } from '../../utils/builder';
import { Point } from '../../utils/geometry';
import { getThemeClass } from '../../utils/themes';

import { getOrCreateEmptyContainer } from '../content-container';
import { DisplayMode } from '../popup-state';
import { LookupPuckId } from '../puck';
import { QueryResult } from '../query';

import { Pad } from './Tabs/Pad';
import { renderArrow } from './arrow';
import { renderCloseButton } from './close';
import { renderCopyOverlay } from './copy-overlay';
import { CopyState } from './copy-state';
import { updateExpandable } from './expandable';
import { addFontStyles, removeFontStyles } from './font-styles';
import { renderKanjiEntries } from './kanji';
import { renderMetadata } from './metadata';
import { renderNamesEntries } from './names';
import { getPopupContainer } from './popup-container';
import popupStyles from './popup.css?inline';
import { ShowPopupOptions } from './show-popup';
// import { ShowPopupOptions, ExtendedDataSeries } from './show-popup';
import { renderCopyDetails, renderUpdatingStatus } from './status';
import { onHorizontalSwipe } from './swipe';
import { renderTabBar, showWordsTab } from './tabs';
import { renderWordEntries } from './words';

export function renderPopup(
  result: QueryResult | undefined,
  options: ShowPopupOptions
): HTMLElement | null {
  // We add most styles to the shadow DOM but it turns out that browsers don't
  // load @font-face fonts from the shadow DOM [1], so we need to add @font-face
  // definitions to the main document.
  //
  // [1] e.g see https://issues.chromium.org/issues/41085401
  if (!options.fontFace || options.fontFace === 'bundled') {
    addFontStyles();
  } else {
    removeFontStyles();
  }

  const container = options.container || getDefaultContainer();
  const windowElem = resetContainer({
    host: container,
    displayMode: options.displayMode,
    fontFace: options.fontFace || 'bundled',
    fontSize: options.fontSize || 'normal',
    popupStyle: options.popupStyle,
  });
  const contentContainer = html('div', { class: 'content' });

  const hasResult = result && (result.words || result.kanji || result.names);
  const showTabs =
    hasResult &&
    result.resultType !== 'db-unavailable' &&
    !result.title &&
    options.tabDisplay !== 'none';

  if (showTabs) {
    const enabledTabs = {
      words: showWordsTab(result, !!options.meta),
      kanji: !!result?.kanji,
      names: !!result?.names,
      pad: true,
    };

    windowElem.append(
      renderTabBar({
        closeShortcuts: options.closeShortcuts,
        displayMode: options.displayMode,
        enabledTabs,
        onClosePopup: options.onClosePopup,
        onShowSettings: options.onShowSettings,
        onSwitchDictionary: options.onSwitchDictionary,
        onTogglePin: options.onTogglePin,
        pinShortcuts: options.pinShortcuts,
        selectedTab: options.dictToShow,
      })
    );

    windowElem.dataset.tabSide = options.tabDisplay || 'top';

    onHorizontalSwipe(contentContainer, (direction) => {
      options.onSwitchDictionary?.(direction === 'left' ? 'prev' : 'next');
    });
  }

  // Handle Pad tab separately
  if (options.dictToShow === 'pad') {
    const padElement = html('div', { class: 'entry-data' });
    render(h(Pad, {}), padElement);
    contentContainer.append(padElement);
  } else {
    // Handle other tabs that depend on QueryResult data
    const resultToShow = result?.[options.dictToShow];

    if (!resultToShow) {
      // No result to show but we might still show metadata
      if (options.meta) {
        const metadata = renderMetadata({
          fxData: options.fxData,
          preferredUnits: options.preferredUnits,
          isCombinedResult: false,
          matchLen: 0,
          meta: options.meta,
          metaonly: true,
        });
        if (metadata) {
          contentContainer.append(
            html('div', { class: 'wordlist entry-data' }, metadata)
          );
        } else {
          return null;
        }
      } else {
        return null;
      }
    } else {
      // Handle different result types
      switch (resultToShow.type) {
        case 'kanji':
          contentContainer.append(
            html(
              'div',
              { class: 'expandable' },
              renderKanjiEntries({ entries: resultToShow.data, options })
            )
          );
          break;

        case 'names':
          contentContainer.append(
            renderNamesEntries({
              entries: resultToShow.data,
              matchLen: resultToShow.matchLen,
              more: resultToShow.more,
              options: {
                ...options,
                // Hide the meta if we have already shown it on the words tab
                meta: result?.words ? undefined : options.meta,
              },
            })
          );
          break;

        case 'words':
          contentContainer.append(
            html(
              'div',
              { class: 'expandable' },
              renderWordEntries({
                entries: resultToShow.data,
                matchLen: resultToShow.matchLen,
                more: resultToShow.more,
                namePreview: result.namePreview,
                options,
                title: result.title,
              })
            )
          );
          break;
      }
    }
  }

  // Render the copy overlay if needed
  if (showOverlay(options.copyState)) {
    contentContainer.append(
      html(
        'div',
        { class: 'grid-stack' },
        // Dictionary content
        html('div', {}, ...contentContainer.children),
        renderCopyOverlay({
          copyState: options.copyState,
          includeAllSenses: options.copy?.includeAllSenses !== false,
          includeLessCommonHeadwords:
            options.copy?.includeLessCommonHeadwords !== false,
          includePartOfSpeech: options.copy?.includePartOfSpeech !== false,
          kanjiReferences: options.kanjiReferences,
          onCancelCopy: options.onCancelCopy,
          onCopy: options.onCopy,
          // Don't pass result for pad tab
          result: options.dictToShow === 'pad' ? undefined : result,
          // Use 'words' as fallback for pad tab
          series: options.dictToShow === 'pad' ? 'words' : options.dictToShow,
          showKanjiComponents: options.showKanjiComponents,
        })
      )
    );

    // Set the overlay styles for the window, but wait a moment so we can
    // transition the styles in.
    requestAnimationFrame(() => {
      // TODO: Drop the class and just keep the data attribute once we've
      // converted everything to Tailwind
      windowElem.classList.add('-has-overlay');
      windowElem.dataset.hasOverlay = 'true';
    });
  }

  // Set copy styles
  switch (options.copyState.kind) {
    case 'active':
      windowElem.classList.add('-copy-active');
      break;

    case 'error':
      windowElem.classList.add('-copy-error');
      break;

    case 'finished':
      windowElem.classList.add('-copy-finished');
      break;
  }

  // Generate status bar contents
  const copyDetails = renderCopyDetails({
    copyNextKey: options.copyNextKey,
    copyState: options.copyState,
    // Use 'words' as fallback for pad tab
    series:
      options.dictToShow === 'pad'
        ? 'words'
        : result?.[options.dictToShow]?.type || 'words',
  });

  let statusBar: HTMLElement | null = null;
  if (copyDetails) {
    statusBar = copyDetails;
  } else if (hasResult && result?.resultType === 'db-updating') {
    statusBar = renderUpdatingStatus();
  }

  let contentWrapper = contentContainer;
  if (statusBar) {
    contentWrapper = html(
      'div',
      { class: 'status-bar-wrapper' },
      contentContainer,
      statusBar
    );
  }

  if (!showTabs && options.onClosePopup) {
    windowElem.append(
      html(
        'div',
        { class: 'close-button-wrapper' },
        contentWrapper,
        renderCloseButton(options.onClosePopup, options.closeShortcuts || [])
      )
    );
  } else {
    windowElem.append(contentWrapper);
  }

  // Collapse expandable containers
  for (const expandable of contentContainer.querySelectorAll<HTMLElement>(
    '.expandable'
  )) {
    updateExpandable(expandable, {
      ...options,
      showKeyboardShortcut: options.displayMode === 'static',
    });
  }

  // Scroll any selected items into view.
  //
  // We need to wait until after the popup has been positioned, however, as
  // otherwise we won't know if it's in view or not.
  requestAnimationFrame(() => {
    const selectedElem =
      contentContainer.querySelector('.expandable .-selected') ||
      contentContainer.querySelector('.-flash');
    selectedElem?.scrollIntoView({ block: 'nearest' });
  });

  return container;
}

function getDefaultContainer(): HTMLElement {
  const defaultContainer = getOrCreateEmptyContainer({
    id: 'tenten-ja-window',
    styles: popupStyles.toString(),
    // Make sure the popup container appears _before_ the puck container so that
    // we can assign them the same z-index and have the puck appear on top.
    before: LookupPuckId,
    legacyIds: ['rikaichamp-window'],
  });

  // TODO: Create shadow root in getOrCreateEmptyContainer.
  let shadow = defaultContainer.shadowRoot;
  if (!shadow) {
    shadow = defaultContainer.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = popupStyles;
    shadow.append(style);
  }

  // For Wikipedia we need to be careful to not use any invert filters.
  //
  // As of this writing Wikipedia's infoboxes have their own invert color in
  // dark mode that we don't need to (and should not) cancel out.
  if (document.location.hostname.endsWith('wikipedia.org')) {
    defaultContainer.classList.add('mw-no-invert');
    defaultContainer.style.filter = 'inherit';
  }

  return defaultContainer;
}

function resetContainer({
  host,
  displayMode,
  fontFace,
  fontSize,
  popupStyle,
}: {
  host: HTMLElement;
  displayMode: DisplayMode;
  fontFace: FontFace;
  fontSize: FontSize;
  popupStyle: string;
}): HTMLElement {
  const container = html('div', { class: 'container' });
  const windowDiv = html('div', { class: 'window', 'data-type': 'window' });
  container.append(windowDiv);

  // Set initial and interactive status
  container.classList.toggle('ghost', displayMode === 'ghost');
  container.classList.toggle('interactive', displayMode !== 'static');
  container.classList.toggle('pinned', displayMode === 'pinned');

  // Set theme
  windowDiv.classList.add(getThemeClass(popupStyle));

  // Font face
  if (fontFace === 'bundled') {
    windowDiv.classList.add('bundled-fonts');
  }

  // Font size
  if (fontSize !== 'normal') {
    windowDiv.classList.add(`font-${fontSize}`);
  }

  if (host.shadowRoot) {
    const contentElem = host.shadowRoot.querySelector<HTMLElement>('.container');
    if (contentElem) {
      // Set aria-hidden to true for the element we're about to replace.
      contentElem.setAttribute('aria-hidden', 'true');

      // Clear any old elements out
      host.shadowRoot.replaceChild(container, contentElem);
    } else {
      // Fresh popup, host has a shadow DOM but no container
      host.shadowRoot.append(container);
    }
  } else {
    // TODO: Remove this case once we've migrated completely to using a shadow DOM.
    // (As of this writing we only use this when we have a foreign object element
    // as the host.)
    const contentElem = host.querySelector<HTMLElement>('.container');
    if (contentElem) {
      contentElem.setAttribute('aria-hidden', 'true');
      host.replaceChild(container, contentElem);
    } else {
      host.append(container);
    }
  }

  return windowDiv;
}

function showOverlay(copyState: CopyState): boolean {
  return copyState?.kind === 'active';
}

export function renderPopupArrow(options: {
  direction: 'vertical' | 'horizontal';
  popupPos: Point;
  popupSize: { width: number; height: number };
  side: 'before' | 'after';
  target: Point;
  theme: string;
}) {
  const popupContainer = getPopupContainer();
  if (!popupContainer) {
    return;
  }

  // Check for cases where the popup overlaps the target element
  const { popupPos, popupSize, target } = options;
  if (options.direction === 'vertical') {
    if (options.side === 'before' && popupPos.y + popupSize.height > target.y) {
      return;
    } else if (options.side === 'after' && popupPos.y < target.y) {
      return;
    }
  } else {
    if (options.side === 'before' && popupPos.x + popupSize.width > target.x) {
      return;
    } else if (options.side === 'after' && popupPos.x < target.x) {
      return;
    }
  }

  renderArrow({ ...options, popupContainer, target });
}
