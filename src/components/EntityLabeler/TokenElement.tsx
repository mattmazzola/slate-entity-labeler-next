import { RenderElementProps } from "slate-react"
import styled from "styled-components"
import { DebugMode } from "./models"

type TokenProps = RenderElementProps & {
    mode: DebugMode
}

export const TokenElement: React.FC<TokenProps> = props => {
    return (
        <TokenWrapper
            {...props.attributes}
            data-is-token={true}
            mode={props.mode}
        >
            {props.children}
        </TokenWrapper>
    )
}

const TokenWrapper = styled.div<{ mode: DebugMode }>`
    display: inline-block;
    border-radius: 3px;

    ${props => props.mode === DebugMode.Debug
        ? `
        background: var(--color-token-base);
        margin: -1px;
        border 1px solid var(--color-token-base);
        `
        : ''
        }
`