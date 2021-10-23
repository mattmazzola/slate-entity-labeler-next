import { createGlobalStyle } from 'styled-components'
import { COLORS, WEIGHTS, FAMILIES } from './constants'

const GlobalStyles = createGlobalStyle`
    html, body {
        height: 100%;
    }

    body {
        margin: 0;
        padding: 0;

        font-family: var(--font-family-sans-serif);
        background-color: var(--color-gray-900);
        color: var(--color-white);
        font-size: 16px;
    }

    code {
        font-family: var(--font-family-code);
    }

    *,
    *:before,
    *:after {        box-sizing: border-box;
        line-height: 1.5;
        -webkit-font-smoothing: antialiased;
    }

    #root {
        isolation: isolate;
        min-height: 100%;
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

        --color-entities-base: ${COLORS.entities.base};
        --color-entities-inline: ${COLORS.entities.inline};
        --color-token-base: ${COLORS.token.base};
        --color-token-inline: ${COLORS.token.inline};

        --font-weight-normal: ${WEIGHTS.normal};
        --font-weight-medium: ${WEIGHTS.medium};
        --font-weight-bold: ${WEIGHTS.bold};

        --font-family-serif: ${FAMILIES.serif};
        --font-family-sans-serif: ${FAMILIES.sansSerif};
        --font-family-code: ${FAMILIES.code};
    }
`

export default GlobalStyles