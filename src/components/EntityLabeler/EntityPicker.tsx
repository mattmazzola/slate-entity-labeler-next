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
}

// This works because options and entity type are the same
const convertOptionToEntity = (option: Option): Entity => option

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
            onKeyDown={onKeyDown}
        >
            <Input type="text" value={searchText} onChange={onChangeSearchInput} />
            <button onClick={props.onClickCreate}>Create Entity</button>
            <OptionsList ref={optionsRef}>
                {matchedOptions.map((matchedOption, i) => {
                    return (
                        <OptionElement
                            key={i}
                            onClick={() => onSelectOption(matchedOption.original)}
                            highlighted={highlightIndex === i}
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
    transition: transform 0.2s cubic-bezier(.3,1.2,.2,1), left 0.2s ease-in-out, opacity 0.7s;

    position: absolute;
    top: var(--top);
    left: var(--left);
`

const Input = styled.input`
    border: 1px solid var(--color-grey-300);
    padding: 0.25rem;

    :focus {
        border-color: var(--color-grey-200);
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
    background: ${props => props.highlighted ? `rgba(187, 255, 187, 1.0);` : 'none;'}

    :hover,
    :focus {
        background: rgba(187, 255, 187, 0.5);
        outline: none;
    }
`