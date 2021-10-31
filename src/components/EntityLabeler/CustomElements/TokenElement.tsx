import { RenderElementProps } from "slate-react"
import styled from "styled-components"
import { DebugMode } from "../models"

type Props = RenderElementProps & {
    mode: DebugMode
}

export const TokenElement: React.FC<Props> = props => {
    const tokenStyles = {
        '--background-color': props.mode === DebugMode.Debug ? `var(--color-token-base)` : 'none',
        '--margin': props.mode === DebugMode.Debug ? `-1px` : 'unset',
        '--border': props.mode === DebugMode.Debug ? `1px solid var(--color-token-base)` : 'unset',
    } as React.CSSProperties

    return (
        <TokenWrapper
            {...props.attributes}
            data-is-token={true}
            mode={props.mode}
            style={tokenStyles}
        >
            {props.children}
        </TokenWrapper>
    )
}

const TokenWrapper = styled.div<{ mode: DebugMode }>`
    display: inline-block;
    border-radius: 3px;
    background: var(--background-color);
    margin: var(--margin);
    border: var(--border);
`