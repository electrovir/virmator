import {assert, fixture, html} from '@open-wc/testing';

describe('fake test', () => {
    it('tests a thing', async () => {
        const rendered = await fixture(html`
            <p>hi</p>
        `);
        assert.instanceOf(rendered, HTMLParagraphElement);
    });
});
