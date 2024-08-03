import {defineElementNoInputs, html} from 'element-vir';

export const VirApp = defineElementNoInputs({
    tagName: 'vir-app',
    renderCallback() {
        return html`
            Vir App goes here!
        `;
    },
});
