import React from 'react'
import styled from 'styled-components'
import { Entity } from './models'
import { FuseMatch } from '../FuseMatch'
import { usePicker } from './usePicker'
import { Option } from './models'

type Position = {
    top: number
    left: number
}

export type PickerProps = {
    isVisible: boolean
    position: Position
}

type Props = PickerProps & {
    entities: Entity[]
    onClickCreate: () => void
    onSelectEntity: (entity: Entity) => void
    onDismissPicker: () => void
}

// This works because options and entity type are the same
const convertOptionToEntity = (option: Option): Entity => option

const scrollHighlightedElementIntoView = (resultsElement: HTMLDivElement) => {
    const highlightedElement = resultsElement
        ? resultsElement.querySelector('[data-is-highlighted="true"]') as HTMLDivElement
        : null

    if (highlightedElement) {
        highlightedElement.scrollIntoView({
            behavior: 'smooth',
            block: "nearest"
        })
    }
}

export const EntityPicker = React.forwardRef<HTMLDivElement, Props>((props, forwardedRef) => {
    const optionsRef = React.useRef<HTMLDivElement>(null)

    const onSelectOption = (option: Option) => {
        const entity = convertOptionToEntity(option)
        props.onSelectEntity(entity)

        // Reset options list scroll
        if (optionsRef.current) {
            optionsRef.current.scrollTop = 0
        }
    }

    const { searchText, setSearchText, onKeyDown, matchedOptions, highlightIndex, resetHighlighIndex } = usePicker(
        props.entities,
        100,
        onSelectOption,
    )

    React.useEffect(() => {
        if (optionsRef.current) {
            scrollHighlightedElementIntoView(optionsRef.current)
        }
    }, [highlightIndex, optionsRef.current])

    const onPickerKeyDown: React.KeyboardEventHandler<HTMLDivElement> = event => {
        switch (event.key) {
            case 'Escape':
                props.onDismissPicker()
                event.preventDefault()
                return
        }

        onKeyDown(event)
    }

    const onChangeSearchInput: React.ChangeEventHandler<HTMLInputElement> = event => {
        setSearchText(event.target.value)
    }

    React.useEffect(() => {
        if (props.isVisible === false) {
            setSearchText('')
            resetHighlighIndex()
        }
    }, [props.isVisible, setSearchText, resetHighlighIndex])

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
            onKeyDown={onPickerKeyDown}
        >
            <Input type="text" value={searchText} onChange={onChangeSearchInput} />
            <button onClick={props.onClickCreate}>Create Entity</button>
            <OptionsList ref={optionsRef}>
                {matchedOptions.map((matchedOption, i) => {
                    const isHighlighted = highlightIndex === i
                    return (
                        <OptionElement
                            key={i}
                            onClick={() => onSelectOption(matchedOption.original)}
                            highlighted={isHighlighted}
                            data-is-highlighted={isHighlighted}
                        >
                            <FuseMatch matches={matchedOption.matchedStrings} />
                        </OptionElement>
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
    transition: transform 0.2s cubic-bezier(.3,1.2,.2,1),
                top 0.2s ease-in-out,
                left 0.2s ease-in-out,
                opacity 0.7s;

    will-change: transform;

    position: absolute;
    top: var(--top);
    left: var(--left);
    overscroll-behavior: contain;
`

const Input = styled.input`
    border: 1px solid var(--color-gray-500);
    padding: 0.25em;

    :focus {
        border-color: var(--color-gray-300);
    }
`

const OptionsList = styled.div`
    display: flex;
    flex-direction: column;
    overflow: auto;
`

const OptionElement = styled.button<{ highlighted: boolean }>`
    padding: 0.25rem;
    cursor: pointer;
    border: none;
    border-radius: 3px;
    transition: background 800ms ease-out;

    &[data-is-highlighted="true"],
    :focus {
        transition: background 400ms ease-in;
        background: var(--color-picker-highlighted);
    }

    :hover:not([data-is-highlighted="true"]) {
        background: var(--color-picker-hover);
        outline: none;
    }
`