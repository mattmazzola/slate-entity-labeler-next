import React from 'react'
import { useSlate } from 'slate-react'
import styled from 'styled-components'
import { CustomEditor } from './utils'

type Props = {
    onClear: () => void
    onSave: () => void
    onLoad: () => void
}

export const Toolbar: React.FC<Props> = props => {
    const editor = useSlate()
    return (
        <Wrapper>
            <Button
                onClick={() => {
                    props.onClear()
                }}
            >
                Reset
            </Button>
            <Button
                onClick={() => {
                    props.onSave()
                }}
            >
                Save
            </Button>
            <Button
                onClick={() => {
                    props.onLoad()
                }}
            >
                Load
            </Button>
            <Button
                onClick={() => {
                    CustomEditor.toggleBoldMark(editor)
                }}
            >
                Bold
            </Button>
            <Button
                onClick={() => {
                    CustomEditor.toggleCodeBlock(editor)
                }}
            >
                Code Block
            </Button>
            <Button
                onClick={() => {
                    CustomEditor.toggleBlockEntity(editor)
                }}
            >
                Create Block Entity
            </Button>
            <Button
                onMouseDown={() => {
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
