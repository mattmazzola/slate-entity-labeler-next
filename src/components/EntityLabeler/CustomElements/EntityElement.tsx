import { RenderElementProps } from "slate-react"
import styled from "styled-components"
import { CustomElement } from "../utils"
import { DebugMode } from "../models"

type Props = RenderElementProps & {
    mode: DebugMode
}

const unknonwnEntityElement: CustomElement = {
    children: [],
    type: "entity",
    entityId: 'default-entity-id',
    entityName: 'Unknown Name'
}

export const EntityElement: React.FC<Props> = props => {
    const entityElement = props.element.type === 'entity'
        ? props.element
        // Should never happen, but will give visual indicator if used by showing "unknown" as name
        : unknonwnEntityElement

    return (
        <EntityWrapper
            {...props.attributes}
            data-is-entity={true}
        >
            {props.children}
            <EntityName data-name={entityElement.entityName} />
        </EntityWrapper>
    )
}

const EntityWrapper = styled.div`
    position: relative;
    display: inline-block;
    border-radius: 3px;

    background: var(--color-entities-base);
    margin: -1px;
    border 1px solid var(--color-entities-base);
`

// Use pseudo content to prevent selection
// Technique described here
// https://danoc.me/blog/css-prevent-copy/#an-elegant-solution-using-pseudo-elements
const EntityName = styled.div`
    position: absolute;
    top: calc(-100% + 1rem);
    white-space: nowrap;
    font-size: 1.1rem;
    color: var(--color-entities-name);

    ::before {
        content: attr(data-name);
    }
`