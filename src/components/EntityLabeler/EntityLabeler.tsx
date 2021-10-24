import React from 'react'

import { createEditor } from 'slate'
import { Slate, Editable, withReact, DefaultElement, RenderElementProps } from 'slate-react'
import { debounce, CustomElement, serialize, withLabels, CustomEditor } from './utils'
import { Toolbar } from './Toolbar'
import { defaultValue } from './utils'
import styled from 'styled-components'
import { convertEntitiesAndTextToTokenizedEditorValue, CustomText, deserialize, IEntity } from '.'

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

export enum LabelMode {
    EditText = 'EditText',
    Label = 'Label'
}

export enum DebugMode {
    Normal = 'Normal',
    Debug = 'Debug'
}

type Props = {
    text: string,
    entities: IEntity<unknown>[]
    labelMode: LabelMode
    debugMode: DebugMode
    onChangeValue: (value: CustomElement[]) => void
}

const EntityLabeler: React.FC<Props> = props => {
    const debouncedOnChange = React.useCallback(debounce(props.onChangeValue, 500), [props.onChangeValue])
    const [value, setValue] = React.useState<CustomElement[]>(defaultValue)
    React.useEffect(() => {
        debouncedOnChange(value)
    }, [value])

    React.useEffect(() => {
        switch(props.labelMode) {
            case LabelMode.EditText: {
                const newValue = deserialize(props.text)
                setValue(newValue)
                break;
            }
            case LabelMode.Label: {
                const newValue = convertEntitiesAndTextToTokenizedEditorValue(props.text, props.entities)
                setValue(newValue)
                break;
            }
        }
    }, [props.text, props.entities.length, props.labelMode])

    React.useEffect(() => {
        const serializedValue = serialize(value)

        switch(props.labelMode) {
            case LabelMode.EditText: {
                const newValue = deserialize(serializedValue)
                setValue(newValue)
                break;
            }
            case LabelMode.Label: {
                const newValue = convertEntitiesAndTextToTokenizedEditorValue(serializedValue, [])
                setValue(newValue)
                break;
            }
        }
    }, [props.labelMode])

    const editor = React.useMemo(() => withLabels(withReact(createEditor())), [])

    const onSaveValue = () => {
        if (typeof value === 'object') {
            saveValue(value)
        }
    }

    const onLoadValue = () => {
        const value = getSavedValueOrDefault()

        setValue(value)
    }

    const editOperationTypes = [
        'remove_text',
        'remove_node',
        'insert_text',
        'insert_node',
    ]

    return (
        <Slate
            editor={editor}
            value={value}
            onChange={value => {

                const eitOperations = editor.operations.filter(op => {
                    return editOperationTypes.find(editOpType => editOpType === op.type)
                })

                const containsEditOperation = eitOperations.length > 0
                // console.log('Operations: ', editor.operations.map(o => o.type))
                // console.log(`containsEditOperation: `, containsEditOperation)

                // If in label mode, prevent text modifications but allow entities to be created
                if (props.labelMode === LabelMode.Label && containsEditOperation) {
                    console.warn(`Edit operations blocked: `, eitOperations.map(o => o.type))
                    return
                }

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
                        renderElement={renderElementProps => renderElement(props.debugMode, renderElementProps)}
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

const EntityWrapper = styled.div<{ mode: DebugMode }>`
    display: inline-block;
    border-radius: 3px;

    ${props => props.mode === DebugMode.Debug
        ? `
        background: var(--color-entities-base);
        margin: -1x;
        border 1px solid var(--color-entities-base);
        `
        : ''}
`

type ElementProps = RenderElementProps & {
    mode: DebugMode
}

const EntityElement: React.FC<ElementProps> = props => {
    return (
        <EntityWrapper
            {...props.attributes}
            data-is-entity={true}
            mode={props.mode}
        >
            {props.children}
        </EntityWrapper>
    )
}

const TokenWrapper = styled.div<{ mode: DebugMode }>`
    display: inline-block;
    border-radius: 3px;

    ${props => props.mode === DebugMode.Debug
        ? `
        background: var(--color-token-base);
        margin: -1px;
        border 1px solid var(--color-token-base);
        `
        : ''
    }
`

const TokenElement: React.FC<ElementProps> = props => {
    return (
        <TokenWrapper
            {...props.attributes}
            data-is-token={true}
            mode={props.mode}
        >
            {props.children}
        </TokenWrapper>
    )
}


const renderElement = (mode: DebugMode, props: RenderElementProps) => {
    switch (props.element.type) {
        case 'entity':
            return <EntityElement {...props} mode={mode} />
        case 'token':
            return <TokenElement {...props} mode={mode} />
        default:
            return <DefaultElement {...props} />
    }
}

export default EntityLabeler
