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

    const onClickName: React.MouseEventHandler<HTMLDivElement> = event => {
        console.log('click', event)
        event.preventDefault()
        event.stopPropagation()
        return false
    }

    return (
        <EntityWrapper
            {...props.attributes}
            data-is-entity={true}
        >
            {props.children}
            <EntityName onClick={onClickName} data-name={entityElement.entityName} />
        </EntityWrapper>
    )
}

const EntityWrapper = styled.div`
    position: relative;
    display: inline-block;
    border-radius: 3px;

    background: var(--color-entities-background);
    margin: -1px;
    border 1px solid var(--color-entities-border);
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
    max-width: 100%;
    overflow: hidden;

    ::before {
        content: attr(data-name);
    }

    :hover {
        max-width: unset;
        overflow: unset;
        background: var(--color-gray-900);
        border-right: 4px solid var(--color-gray-900);
        color: var(--color-entities-name-highlight);
        z-index: 2;
    }
`