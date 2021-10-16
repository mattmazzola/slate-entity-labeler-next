import React from 'react'
import { useSlate } from 'slate-react'
import styled from 'styled-components'
import { CustomEditor } from './utils'

type Props = {
    onReset: () => void
}

export const Toolbar: React.FC<Props> = props => {
    const editor = useSlate()
    return (
        <Wrapper>
            <Button
                onMouseDown={event => {
                    event.preventDefault()
                    props.onReset()
                }}
            >
                Reset
            </Button>
            <Button
                onMouseDown={event => {
                    event.preventDefault()
                    CustomEditor.toggleBoldMark(editor)
                }}
            >
                Bold
            </Button>
            <Button
                onMouseDown={event => {
                    event.preventDefault()
                    CustomEditor.toggleCodeBlock(editor)
                }}
            >
                Code Block
            </Button>
            <Button
                onMouseDown={event => {
                    event.preventDefault()
                    CustomEditor.toggleBlockEntity(editor)
                }}
            >
                Create Block Entity
            </Button>
            <Button
                onMouseDown={event => {
                    event.preventDefault()
                    CustomEditor.toggleInlineEntity(editor)
                }}
            >
                Create Inline Entity
            </Button>
        </Wrapper>
    )
}

const Wrapper = styled.div`
    display: flex;
    gap: 1rem;
`

const Button = styled.button`
    padding: 0.5em 1em;
    background: none;
    border-radius: 3px;
    border: 1px solid var(--color-white);
    color: var(--color-white);
`
