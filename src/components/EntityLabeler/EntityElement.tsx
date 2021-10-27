import { RenderElementProps } from "slate-react"
import styled from "styled-components"
import { DebugMode } from "./models"

type Props = RenderElementProps & {
    mode: DebugMode
}

export const EntityElement: React.FC<Props> = props => {
    return (
        <EntityWrapper
            {...props.attributes}
            data-is-entity={true}
        >
            {props.children}
        </EntityWrapper>
    )
}

const EntityWrapper = styled.div`
    display: inline-block;
    border-radius: 3px;

    background: var(--color-entities-base);
    margin: -1px;
    border 1px solid var(--color-entities-base);
`
