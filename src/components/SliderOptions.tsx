import React from 'react'
import styled from 'styled-components'
import { LabelMode } from './EntityLabeler'

type SliderOption = {
    name: string
    value: LabelMode
}

type Props = {
    options: SliderOption[]
    selectedOption: LabelMode
    onChangeSelectedOption: (mode: LabelMode) => void
}

export const SliderOptions: React.FC<Props> = (props) => {
    const optionsIndex = props.options.findIndex(o => o.value === props.selectedOption)
    const highlightStyles = { '--optionsIndex': optionsIndex } as React.CSSProperties
    return (
        <Wrapper>
            {props.options.map((option, i) => {
                return (
                    <OptionWrapper key={i} onClick={() => props.onChangeSelectedOption(option.value)}>{option.name}</OptionWrapper>
                )
            })}
            <Highlight style={highlightStyles} />
        </Wrapper>
    )
}

export default SliderOptions

const Wrapper = styled.div`
    --optionWidth: 80;
    --optionPadding: 5px;
    --optionRadius: 12px;
    --optionGap: 0.5rem;

    display: flex;
    gap: var(--optionGap);
    position: relative;
    font-size: 18px;
`

const OptionWrapper = styled.button`
    border-radius: var(--optionRadius);
    width: calc(var(--optionWidth) * 1px);
    background: none;
    border: none;
    color: white;
    padding: var(--optionPadding);
    z-index: 2;
    text-align: center;
    cursor: pointer;
`

const Highlight = styled.div`
    border-radius: var(--optionRadius);
    background: var(--color-slider-highlight);
    width: calc(var(--optionWidth) * 1px);
    position: absolute;
    height: 100%;
    padding: var(--optionPadding);
    pointer-events: none;

    transform: translate(calc((var(--optionsIndex) * var(--optionGap)) + (var(--optionsIndex) * var(--optionWidth) * 1px)));
    transition: transform 200ms;
    will-change: transform;
`