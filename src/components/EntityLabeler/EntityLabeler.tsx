import React from 'react'

import { createEditor } from 'slate'
import { Slate, Editable, withReact, DefaultElement, RenderLeafProps } from 'slate-react'
import { debounce, CustomElement, serialize, withLabels, CustomEditor } from './utils'
import { Toolbar } from './Toolbar'
import { defaultValue } from './utils'
import styled from 'styled-components'
import { convertEntitiesAndTextToTokenizedEditorValue, IEntity } from '.'

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

type Props = {
    text: string,
    entities: IEntity<unknown>[]
    onChangeValue: (value: CustomElement[]) => void
}

const EntityLabeler: React.FC<Props> = props => {
    const [value, setValue] = React.useState<CustomElement[]>(() => convertEntitiesAndTextToTokenizedEditorValue(props.text, props.entities))

    const editor = React.useMemo(() => withLabels(withReact(createEditor())), [])
    const debouncedOnChange = React.useCallback(debounce(props.onChangeValue, 500), [props.onChangeValue])
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

const EntityWrapper = styled.div`
    display: inline-block;
    border-radius: 3px;
    background: var(--color-entities-base);
    margin: -1x;
    border 1px solid var(--color-entities-base);
`

const EntityElement: React.FC<any> = props => {
    return (
        <EntityWrapper {...props.attributes} data-is-entity={true}>
            {props.children}
        </EntityWrapper>
    )
}

const TokenWrapper = styled.div`
    display: inline-block;
    border-radius: 3px;
    background: var(--color-token-base);
    margin: -2px;
    border 1px solid var(--color-token-base);
`

const TokenElement: React.FC<any> = props => {
    return (
        <TokenWrapper {...props.attributes} data-is-token={true}>
            {props.children}
        </TokenWrapper>
    )
}


const renderElement = (props: any) => {
    switch (props.element.type) {
        case 'entity':
            return <EntityElement {...props} />
        case 'token':
            return <TokenElement {...props} />
        default:
            return <DefaultElement {...props} />
    }
}

export default EntityLabeler
