import React from 'react'
import styled from 'styled-components'
import { createEditor, SelectionOperation } from 'slate'
import { Slate, Editable, withReact, DefaultElement, RenderElementProps } from 'slate-react'

import { convertEntitiesAndTextToTokenizedEditorValue, IEntity, deserialize, debounce, defaultValue, CustomElement, serialize, withLabels, batch } from './utils'
import { Toolbar } from './Toolbar'

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

const selectionChange = (...selectionOperations: SelectionOperation[]) => {
    if (!(selectionOperations.length >= 2)) {
        console.error(new Error(`Operations array must have at least 2 items. It's length is: ${selectionOperations.length}`))
        return
    }

    const firstSelectionOperation = selectionOperations.shift()!
    const lastSelectionOperation = selectionOperations.pop()!
    // console.log(`Batched operations: `, selectionOperations)

    const firstAnchor = firstSelectionOperation.newProperties?.anchor
    const lastFocus = lastSelectionOperation.newProperties?.focus
    console.log(`First Anchor: `, firstAnchor)
    console.log(`Last Focus: `, lastFocus)
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
    const batchedSelectionChange = React.useCallback(batch(selectionChange, 500), [])
    const [value, setValue] = React.useState<CustomElement[]>(defaultValue)
    const lastLabelModeRef = React.useRef<LabelMode | undefined>()
    React.useEffect(() => {
        debouncedOnChange(value)
    }, [value])

    React.useEffect(() => {
        console.log(`Text or Entities changed: `, props.text)
        switch (props.labelMode) {
            case LabelMode.EditText: {
                const newValue = deserialize(props.text)
                setValue(newValue)
                break
            }
            case LabelMode.Label: {
                const newValue = convertEntitiesAndTextToTokenizedEditorValue(props.text, props.entities)
                setValue(newValue)
                break
            }
        }
    }, [props.text, props.entities.length])

    React.useEffect(() => {
        if (lastLabelModeRef.current && lastLabelModeRef.current !== props.labelMode) {
            console.log(`Label Mode Changed: `, props.labelMode)
            const serializedValue = serialize(value)

            switch (props.labelMode) {
                case LabelMode.EditText: {
                    const newValue = deserialize(serializedValue)
                    setValue(newValue)
                    break
                }
                case LabelMode.Label: {
                    const newValue = convertEntitiesAndTextToTokenizedEditorValue(serializedValue, [])
                    setValue(newValue)
                    break
                }
            }
        }

        lastLabelModeRef.current = props.labelMode
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

    const selectionOperationType = 'set_selection'

    return (
        <Slate
            editor={editor}
            value={value}
            onChange={value => {

                const editOperations = editor.operations.filter(op => {
                    return editOperationTypes.find(editOpType => editOpType === op.type)
                })

                const containsEditOperation = editOperations.length > 0
                // If in label mode and contains edit operations, terminate early to prevent text modifications
                // Note: Still allow operations to Label Entities / WrapNodes
                if (props.labelMode === LabelMode.Label && containsEditOperation) {
                    console.warn(`Edit operations blocked: `, editOperations.map(o => o.type))
                    return
                }

                const selectionOperations: SelectionOperation[] = editor.operations.filter(op => selectionOperationType === op.type) as any[]
                const containsSelectionOperations = selectionOperations.length > 0
                if (props.labelMode === LabelMode.Label && containsSelectionOperations) {
                    // console.log('Operations: ', editor.operations)
                    batchedSelectionChange(...selectionOperations)
                }

                const customValue = value as CustomElement[]
                setValue(customValue)

                const isAstChange = editor.operations.some(op => selectionOperationType !== op.type)
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
