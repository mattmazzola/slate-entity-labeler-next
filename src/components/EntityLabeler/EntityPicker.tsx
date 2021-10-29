import React from 'react'
import styled from 'styled-components'

type Position = {
    top: number
    left: number
}

export type PickerProps = {
    isVisible: boolean
    position: Position
}

type Props = PickerProps & {
    options: string[]
    onClickCreate: (entityId: string, entityName: string) => void
}

export const EntityPicker = React.forwardRef<HTMLDivElement, Props>((props, forwardedRef) => {
    const randomValue = Math.floor(Math.random() * 10000)
    const entityId = `entityId-${randomValue}`
    const entityName = `entityName-${randomValue}`
    const wrapperStyles = {
        '--opacity': props.isVisible ? '1' : '0',
        '--scale': props.isVisible ? '1' : '0',
        '--top': `${props.position.top}px`,
        '--left': `${props.position.left}px`,
    } as React.CSSProperties

    return (
        <Wrapper
            ref={forwardedRef}
            isVisible={props.isVisible}
            position={props.position}
            style={wrapperStyles}
        >
            <div>
                Entity
            </div>
            <button onClick={() => props.onClickCreate(entityId, entityName)}>Create Entity</button>
            <OptionsList>
                {props.options.map((option, i) => {
                    return (
                        <div key={i}>{option}</div>
                    )
                })}
            </OptionsList>
        </Wrapper>
    )
})

const Wrapper = styled.div<PickerProps>`
    display: grid;
    grid-template-rows: min-content min-content 1fr;
    gap: 0.25em;

    color: black;
    font-size: 1rem;
    background: white;
    border: 1px solid var(--color-neutralTertiary);
    border-radius: 4px;
    box-shadow: 0 1px 10px rgba(0, 0, 0, 0.3);
    min-width: 200px;
    max-width: 300px;
    max-height: 200px;
    padding: 0.25em;
    z-index: 1;

    opacity: var(--opacity);
    transform: scale(var(--scale));
    transform-origin: 50% 10px;
    transition: transform 0.2s cubic-bezier(.3,1.2,.2,1), left 0.2s ease-in-out, opacity 0.7s;

    position: absolute;
    top: var(--top);
    left: var(--left);
`

const OptionsList = styled.div`
    overflow: auto;
`