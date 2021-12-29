import {addAriaReferencedId, getAriaReferenceIds, removeAriaReferencedId} from './aria-reference';

describe('AriaReference', () => {
  let testElement: HTMLElement | null;

  beforeEach(() => {
    testElement = document.createElement('div');
    document.body.appendChild(testElement);
  });

  afterEach(() => {
    testElement?.remove();
  });

  it('should be able to append/remove aria reference IDs', () => {
    addAriaReferencedId(testElement!, 'aria-describedby', 'reference_1');
    expectIds('aria-describedby', ['reference_1']);

    addAriaReferencedId(testElement!, 'aria-describedby', 'reference_2');
    expectIds('aria-describedby', ['reference_1', 'reference_2']);

    removeAriaReferencedId(testElement!, 'aria-describedby', 'reference_1');
    expectIds('aria-describedby', ['reference_2']);

    removeAriaReferencedId(testElement!, 'aria-describedby', 'reference_2');
    expectIds('aria-describedby', []);
  });

  it('should trim whitespace when adding/removing reference IDs', () => {
    addAriaReferencedId(testElement!, 'aria-describedby', '    reference_1   ');
    addAriaReferencedId(testElement!, 'aria-describedby', '    reference_2   ');
    expectIds('aria-describedby', ['reference_1', 'reference_2']);

    removeAriaReferencedId(testElement!, 'aria-describedby', '   reference_1   ');
    expectIds('aria-describedby', ['reference_2']);

    removeAriaReferencedId(testElement!, 'aria-describedby', '   reference_2   ');
    expectIds('aria-describedby', []);
  });

  it('should ignore empty string', () => {
    addAriaReferencedId(testElement!, 'aria-describedby', '  ');
    expectIds('aria-describedby', []);
  });

  it('should not add the same reference id if it already exists', () => {
    addAriaReferencedId(testElement!, 'aria-describedby', 'reference_1');
    addAriaReferencedId(testElement!, 'aria-describedby', 'reference_1');
    expect(getAriaReferenceIds(testElement!, 'aria-describedby')).toEqual(['reference_1']);
  });

  it('should retrieve ids that are delimited by extra whitespace', () => {
    testElement!.setAttribute('aria-describedby', 'reference_1      reference_2');
    expect(getAriaReferenceIds(testElement!, 'aria-describedby')).toEqual([
      'reference_1',
      'reference_2',
    ]);
  });

  /**
   * Expects the equal array from getAriaReferenceIds and a space-delimited list from
   * the actual element attribute. If ids is empty, assumes the element should not have any
   * value
   */
  function expectIds(attr: string, ids: string[]) {
    const value = testElement!.getAttribute(attr);
    expect(getAriaReferenceIds(testElement!, attr)).toEqual(ids);
    ids.length ? expect(value).toBe(ids.join(' ')) : expect(value).toBeFalsy();
  }
});
