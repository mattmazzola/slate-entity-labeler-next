import React from 'react'
import styled from 'styled-components'

type Position = {
    top: number
    left: number
    bottom: number
}

export type PickerProps = {
    isVisible: boolean
    // TODO: Consider discriminated union, since position should not be set when not visible
    position?: Position
}

type Props = PickerProps & {
    options: string[]
    onClickCreate: (entityId: string, entityName: string) => void
}

export const EntityPicker = React.forwardRef<HTMLDivElement, Props>((props, forwardedRef) => {
    const randomValue = Math.floor(Math.random() * 10000)
    const entityId = `entityId-${randomValue}`
    const entityName = `entityName-${randomValue}`

    return (
        <Wrapper
            ref={forwardedRef}
            isVisible={props.isVisible}
            position={props.position}
        >
            <div>
                Entity
            </div>
            <button onClick={() => props.onClickCreate(entityId, entityName)}>Create Entity</button>
            <div>
                {props.options.map((option, i) => {
                    return (
                        <div key={i}>{option}</div>
                    )
                })}
            </div>
        </Wrapper>
    )
})

const Wrapper = styled.div<PickerProps>`
    position: absolute;

    color: black;
    font-size: 1rem;

    background: white;
    border: 1px solid var(--color-neutralTertiary);
    border-radius: 4px;
    box-shadow: 0 1px 10px rgba(0, 0, 0, 0.3);
    min-width: 200px;
    padding: 0.25em;
    transition: opacity .75s;
    z-index: 1;

    opacity: 0;
    visibility: hidden;
    transition: transform 0.15s cubic-bezier(.3,1.2,.2,1), left 0.05s ease-in-out;

    display: grid;
    grid-template-rows: min-content min-content 1fr;
    gap: 0.25em;
    top: 50px;

    ${props => props.isVisible
        ? `
            opacity: 1;
            visibility: visible;
        `
        : ``}

    // TODO: Consider CSS variables instead of props?
    ${props => props.position
        ? `
            left: ${props.position.left}px;
            top: ${props.position.top}px;
        `
        : ``}
`
