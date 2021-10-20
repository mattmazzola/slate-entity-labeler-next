import React from 'react'

import { createEditor } from 'slate'
import { Slate, Editable, withReact, DefaultElement, RenderLeafProps } from 'slate-react'
import { debounce, CustomElement, serialize, withLabels, CustomEditor } from './utils'
import { Toolbar } from './Toolbar'
import { defaultValue } from './defaultValue'
import styled from 'styled-components'

const slatejsContentKey = 'slatejs-content-key'

const getSavedValueOrDefault = () => {
    const storedContent = localStorage.getItem(slatejsContentKey)
    const value: CustomElement[] = storedContent
        ? JSON.parse(storedContent)
        : defaultValue

    return value
}
const saveValue = (value: CustomElement[]) => {
    // Save the value to Local Storage.
    const content = JSON.stringify(value)
    localStorage.setItem(slatejsContentKey, content)
    localStorage.setItem('serializedContent', serialize(value as CustomElement[]))
}

const debouncedSaveValue = debounce(saveValue, 500)

type Props = {
    text: string,
    onChange: (value: CustomElement[]) => void
}

const EntityLabeler: React.FC<Props> = props => {
    const [value, setValue] = React.useState<CustomElement[]>(() => getSavedValueOrDefault())
    const editor = React.useMemo(() => withLabels(withReact(createEditor())), [])
    const debouncedOnChange = React.useCallback(debounce(props.onChange, 500), [props.onChange])
    const onSaveValue = () => {
        if (typeof value === 'object') {
            saveValue(value)
        }
    }

    const onLoadValue = () => {
        const value = getSavedValueOrDefault()

        setValue(value)
    }

    return (
        <Slate
            editor={editor}
            value={value}
            onChange={value => {
                const customValue = value as CustomElement[]
                setValue(customValue)

                const isAstChange = editor.operations.some(
                    op => 'set_selection' !== op.type
                )
                if (isAstChange) {
                    debouncedSaveValue(customValue)
                    debouncedOnChange(customValue)
                }
            }}
        >
            <ToolbarWrapper>
                <Toolbar
                    onClear={() => setValue(defaultValue)}
                    onSave={onSaveValue}
                    onLoad={onLoadValue}
                />
                <EditorWrapper>
                    <Editable
                        renderElement={renderElement}
                        renderLeaf={renderLeaf}
                        onKeyDown={event => {
                            if (!event.ctrlKey) {
                                return
                            }

                            switch (event.key) {
                                case '`': {
                                    event.preventDefault()
                                    CustomEditor.toggleCodeBlock(editor)
                                    break
                                }
                                case 'b': {
                                    event.preventDefault()
                                    CustomEditor.toggleBoldMark(editor)
                                    break
                                }
                            }
                        }}
                    />
                </EditorWrapper>
            </ToolbarWrapper>
        </Slate>
    )
}

const ToolbarWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
`

const EditorWrapper = styled.div`
  [data-slate-editor="true"] {
    border: 1px solid var(--color-white);
    border-radius: 3px;
    padding: 0.5rem;
  }
  
  [data-slate-editor="true"] :is(p, pre) {
    padding: 0;
    margin: 0;
  }
`

const CodeElement: React.FC<any> = props => {
    return (
        <pre {...props.attributes}>
            <code>{props.children}</code>
        </pre>
    )
}

const EntityElement: React.FC<any> = props => {
    return (
        <EntityWrapper {...props.attributes} data-is-entity={true}>
            {props.children}
        </EntityWrapper>
    )
}

const EntityWrapper = styled.div`
    display: inline-block;
    border-radius: 3px;
    background: var(--color-entities-base);
    margin: -2px;
    border 1px solid var(--color-entities-base);
`

const renderElement = (props: any) => {
    switch (props.element.type) {
        case 'code':
            return <CodeElement {...props} />
        case 'entity':
            return <EntityElement {...props} />
        default:
            return <DefaultElement {...props} />
    }
}

const Leaf: React.FC<any> = props => {
    return (
        <span
            {...props.attributes}
            style={{ fontWeight: props.leaf.bold ? 'bold' : 'normal' }}
        >
            {props.children}
        </span>
    )
}

const EntityLeaf: React.FC<any> = props => {
    return (
        <EntityLeafWrapper
            {...props.attributes}
            data-is-inline-entity={true}
        >
            {props.children}
        </EntityLeafWrapper>
    )
}

const EntityLeafWrapper = styled.span`
    border-radius: 3px;
    background: var(--color-entities-inline);
    margin: -2px;
    border 1px solid var(--color-entities-inline);
`

const renderLeaf = (props: RenderLeafProps) => {
    switch (props.leaf.type) {
        case 'entity':
            return <EntityLeaf {...props} />
        default:
            return <Leaf {...props} />
    }
}

export default EntityLabeler
