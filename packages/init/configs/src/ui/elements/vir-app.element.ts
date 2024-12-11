import {defineElementNoInputs, html} from 'element-vir';

export const VirApp = defineElementNoInputs({
    tagName: 'vir-app',
    render() {
        return html`
            Vir App goes here!
        `;
    },
});
