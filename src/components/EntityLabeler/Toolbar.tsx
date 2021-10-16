import React from 'react'
import { useSlate } from 'slate-react'
import { CustomEditor } from './utils'

type Props = {
    onReset: () => void
}

export const Toolbar: React.FC<Props> = props => {
    const editor = useSlate()
    return (
        <div>
            <button
                onMouseDown={event => {
                    event.preventDefault()
                    props.onReset()
                }}
            >
                Reset
            </button>
            <button
                onMouseDown={event => {
                    event.preventDefault()
                    CustomEditor.toggleBoldMark(editor)
                }}
            >
                Bold
            </button>
            <button
                onMouseDown={event => {
                    event.preventDefault()
                    CustomEditor.toggleCodeBlock(editor)
                }}
            >
                Code Block
            </button>
            <button
                onMouseDown={event => {
                    event.preventDefault()
                    CustomEditor.toggleBlockEntity(editor)
                }}
            >
                Create Block Entity
            </button>
            <button
                onMouseDown={event => {
                    event.preventDefault()
                    CustomEditor.toggleInlineEntity(editor)
                }}
            >
                Create Inline Entity
            </button>
        </div>
    )
}
