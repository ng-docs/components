import {browser, Key, element, by} from 'protractor';
import {getScrollPosition} from '../../testing/private/e2e';

describe('scroll blocking', () => {
  beforeEach(() => browser.get('/block-scroll-strategy'));
  afterEach(() => clickOn('disable'));

  it('should not be able to scroll programmatically along the x axis', async () => {
    await scrollPage(0, 100);
    expect((await getScrollPosition()).y).toBe(100, 'Expected the page to be scrollable.');

    await clickOn('enable');
    await scrollPage(0, 200);
    expect((await getScrollPosition()).y).toBe(100, 'Expected the page not to be scrollable.');

    await clickOn('disable');
    await scrollPage(0, 300);
    expect((await getScrollPosition()).y).toBe(300, 'Exected page to be scrollable again.');
  });

  it('should not be able to scroll programmatically along the y axis', async () => {
    await scrollPage(100, 0);
    expect((await getScrollPosition()).x).toBe(100, 'Expected the page to be scrollable.');

    await clickOn('enable');
    await scrollPage(200, 0);
    expect((await getScrollPosition()).x).toBe(100, 'Expected the page not to be scrollable.');

    await clickOn('disable');
    await scrollPage(300, 0);
    expect((await getScrollPosition()).x).toBe(300, 'Exected page to be scrollable again.');
  });

  it('should not be able to scroll via the keyboard along the y axis', async () => {
    const body = element(by.tagName('body'));

    await scrollPage(0, 100);
    expect((await getScrollPosition()).y).toBe(100, 'Expected the page to be scrollable.');

    await clickOn('enable');
    await body.sendKeys(Key.ARROW_DOWN);
    await body.sendKeys(Key.ARROW_DOWN);
    await body.sendKeys(Key.ARROW_DOWN);
    expect((await getScrollPosition()).y).toBe(100, 'Expected the page not to be scrollable.');

    await clickOn('disable');
    await body.sendKeys(Key.ARROW_DOWN);
    await body.sendKeys(Key.ARROW_DOWN);
    await body.sendKeys(Key.ARROW_DOWN);
    expect((await getScrollPosition()).y).toBeGreaterThan(
      100,
      'Expected the page to be scrollable again.',
    );
  });

  it('should not be able to scroll via the keyboard along the x axis', async () => {
    const body = element(by.tagName('body'));

    await scrollPage(100, 0);
    expect((await getScrollPosition()).x).toBe(100, 'Expected the page to be scrollable.');

    await clickOn('enable');
    await body.sendKeys(Key.ARROW_RIGHT);
    await body.sendKeys(Key.ARROW_RIGHT);
    await body.sendKeys(Key.ARROW_RIGHT);
    expect((await getScrollPosition()).x).toBe(100, 'Expected the page not to be scrollable.');

    await clickOn('disable');
    await body.sendKeys(Key.ARROW_RIGHT);
    await body.sendKeys(Key.ARROW_RIGHT);
    await body.sendKeys(Key.ARROW_RIGHT);
    expect((await getScrollPosition()).x).toBeGreaterThan(
      100,
      'Expected the page to be scrollable again.',
    );
  });

  it('should not be able to scroll the page after reaching the end of an element along the y axis', async () => {
    const scroller = element(by.id('scroller'));

    await browser.executeScript(`document.getElementById('scroller').scrollTop = 200;`);
    await scrollPage(0, 100);
    expect((await getScrollPosition()).y).toBe(100, 'Expected the page to be scrollable.');

    await clickOn('enable');
    await scroller.sendKeys(Key.ARROW_DOWN);
    await scroller.sendKeys(Key.ARROW_DOWN);
    await scroller.sendKeys(Key.ARROW_DOWN);

    expect((await getScrollPosition()).y).toBe(100, 'Expected the page not to have scrolled.');
  });

  it('should not be able to scroll the page after reaching the end of an element along the x axis', async () => {
    const scroller = element(by.id('scroller'));

    await browser.executeScript(`document.getElementById('scroller').scrollLeft = 200;`);
    await scrollPage(100, 0);
    expect((await getScrollPosition()).x).toBe(100, 'Expected the page to be scrollable.');

    await clickOn('enable');
    await scroller.sendKeys(Key.ARROW_RIGHT);
    await scroller.sendKeys(Key.ARROW_RIGHT);
    await scroller.sendKeys(Key.ARROW_RIGHT);

    expect((await getScrollPosition()).x).toBe(100, 'Expected the page not to have scrolled.');
  });
});

// Clicks on a button programmatically. Note that we can't use Protractor's `.click`, because
// it performs a real click, which will scroll the button into view.
async function clickOn(id: string) {
  await browser.executeScript(`document.getElementById('${id}').click()`);
}

// Scrolls the page to the specified coordinates.
async function scrollPage(x: number, y: number) {
  await browser.executeScript(`window.scrollTo(${x}, ${y});`);
}
