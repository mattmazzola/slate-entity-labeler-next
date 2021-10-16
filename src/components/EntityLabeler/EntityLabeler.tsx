import React from 'react'

import { createEditor } from 'slate'
import { Slate, Editable, withReact, DefaultElement } from 'slate-react'
import { debounce, CustomElement, serialize, withLabels, CustomEditor } from './utils'
import { Toolbar } from './Toolbar'
import { defaultValue } from './defaultValue'

const slatejsContentKey = 'slatejs-content-key'
const storedContent = localStorage.getItem(slatejsContentKey)
const initialValue: CustomElement[] = storedContent
    ? JSON.parse(storedContent)
    : defaultValue

const saveValue = (value: CustomElement[]) => {
    // Save the value to Local Storage.
    const content = JSON.stringify(value)
    localStorage.setItem(slatejsContentKey, content)
    localStorage.setItem('serializedContent', serialize(value as CustomElement[]))
}

const debouncedSaveValue = debounce(saveValue, 500)

type Props = {
    onChange: (value: CustomElement[]) => void
}

const EntityLabeler: React.FC<Props> = props => {
    const [value, setValue] = React.useState<CustomElement[]>(initialValue)
    const editor = React.useMemo(() => withLabels(withReact(createEditor())), [])
    const debouncedOnChange = React.useCallback(debounce(props.onChange, 500), [props.onChange])
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
            <Toolbar onReset={() => setValue(defaultValue)} />
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
        </Slate>
    )
}

const CodeElement: React.FC<any> = props => {
    return (
        <pre {...props.attributes}>
            <code>{props.children}</code>
        </pre>
    )
}

const EntityElement: React.FC<any> = props => {
    return (
        <div {...props.attributes} data-is-entity={true}>
            {props.children}
        </div>
    )
}

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

const renderLeaf = (props: any) => {
    return <Leaf {...props} />
}

export default EntityLabeler
