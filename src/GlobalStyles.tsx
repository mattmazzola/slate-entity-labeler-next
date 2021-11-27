import { createGlobalStyle } from 'styled-components'
import { COLORS, WEIGHTS, FAMILIES } from './constants'

const GlobalStyles = createGlobalStyle`
    /*
    Josh's Custom CSS Reset
    https://www.joshwcomeau.com/css/custom-css-reset/
    */
    *, *::before, *::after {
        box-sizing: border-box;
    }

    * {
        margin: 0;
    }

    html, body, #root {
        height: 100%;
    }

    body {
        line-height: 1.5;
        -webkit-font-smoothing: antialiased;
    }

    img, picture, video, canvas, svg {
        display: block;
        max-width: 100%;
    }

    input, button, textarea, select {
        font: inherit;
    }

    p, h1, h2, h3, h4, h5, h6 {
        overflow-wrap: break-word;
    }

    #root {
        isolation: isolate;
    }

    body {
        font-family: var(--font-family-sans-serif);
        background-color: var(--color-gray-900);
        color: var(--color-white);
        font-size: 16px;

        -webkit-font-smoothing: antialiased;
    }

    code {
        font-family: var(--font-family-code);
    }

    h1, h2, h3 {
        line-height: 1.5;
        margin: 0.25em 0;
    }

    html {
        scroll-behavior: smooth;
    }

    body {
        scrollbar-color: red blue;
    }
    
    ::-webkit-scrollbar {
        width: 10px;
        background-color: var(--color-gray-900);
    }
    ::-webkit-scrollbar-thumb {
        background-color: var(--color-gray-300);
        border: 2px solid var(--color-gray-300);
        border-radius: 1000px;
    }
    ::-webkit-scrollbar-thumb:hover {
        background-color: var(--color-gray-100);
        border-color: var(--color-gray-100);
    }

    :root {
        --color-white: ${COLORS.white};
        --color-offblack: ${COLORS.offblack};
        --color-gray-100: ${COLORS.gray[100]};
        --color-gray-300: ${COLORS.gray[300]};
        --color-gray-500: ${COLORS.gray[500]};
        --color-gray-700: ${COLORS.gray[700]};
        --color-gray-900: ${COLORS.gray[900]};
        --color-primary: ${COLORS.primary};
        --color-secondary: ${COLORS.secondary};
        --color-urgent: ${COLORS.urgent};

        --color-slider-highlight: ${COLORS.slider.highlight};

        --color-picker-highlighted: ${COLORS.picker.highlight};
        --color-picker-hover: ${COLORS.picker.hover};
        --color-entities-background: ${COLORS.entities.background};
        --color-entities-border: ${COLORS.entities.border};
        --color-entities-name: ${COLORS.entities.name};
        --color-entities-name-highlight: ${COLORS.entities.highlight};
        --color-token-base: ${COLORS.token.base};

        --font-weight-normal: ${WEIGHTS.normal};
        --font-weight-medium: ${WEIGHTS.medium};
        --font-weight-bold: ${WEIGHTS.bold};

        --font-family-serif: ${FAMILIES.serif};
        --font-family-sans-serif: ${FAMILIES.sansSerif};
        --font-family-code: ${FAMILIES.code};
    }
`

export default GlobalStyles